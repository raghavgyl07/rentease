const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// Helper: calculate number of days between two dates (inclusive start, exclusive end)
const calcDays = (pickup, returnDate) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((returnDate - pickup) / msPerDay);
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Authenticated Customers only
const createBooking = async (req, res, next) => {
  try {
    const { vehicleId, pickupDate, returnDate } = req.body;

    // Basic field presence check
    if (!vehicleId) {
      return res.status(400).json({ message: 'Vehicle ID is required.' });
    }
    if (!pickupDate) {
      return res.status(400).json({ message: 'Pickup date is required.' });
    }
    if (!returnDate) {
      return res.status(400).json({ message: 'Return date is required.' });
    }

    // Validate vehicle ID format
    if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
      return res.status(400).json({ message: 'Invalid vehicle ID.' });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);

    // Validate date formats
    if (isNaN(pickup.getTime())) {
      return res.status(400).json({ message: 'Invalid pickup date format.' });
    }
    if (isNaN(returnD.getTime())) {
      return res.status(400).json({ message: 'Invalid return date format.' });
    }

    // Reject past pickup date (compare date only, not time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickup < today) {
      return res.status(400).json({ message: 'Pickup date cannot be in the past.' });
    }

    // Return date must be after pickup date
    if (returnD <= pickup) {
      return res.status(400).json({ message: 'Return date must be after pickup date.' });
    }

    // Check vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    // Check vehicle availability flag
    if (!vehicle.availabilityStatus) {
      return res.status(400).json({ message: 'Vehicle is not available for booking.' });
    }

    // Check for overlapping confirmed bookings
    // Overlap condition: existing pickup < new return AND existing return > new pickup
    const overlapping = await Booking.findOne({
      vehicleId,
      bookingStatus: 'Confirmed',
      pickupDate: { $lt: returnD },
      returnDate: { $gt: pickup },
    });

    if (overlapping) {
      return res.status(409).json({
        message: 'Vehicle is already booked for the selected dates.',
      });
    }

    const numberOfDays = calcDays(pickup, returnD);
    const totalAmount = numberOfDays * vehicle.pricePerDay;

    const booking = await Booking.create({
      userId: req.user._id,
      vehicleId,
      pickupDate: pickup,
      returnDate: returnD,
      numberOfDays,
      totalAmount,
    });

    await booking.populate([
      { path: 'userId', select: 'name email' },
      { path: 'vehicleId', select: 'vehicleName registrationNumber pricePerDay' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings for the logged-in customer
// @route   GET /api/bookings/my
// @access  Authenticated
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('vehicleId', 'vehicleName vehicleType registrationNumber pricePerDay location')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      total: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single booking by ID (only owner)
// @route   GET /api/bookings/:id
// @access  Authenticated
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id)
      .populate('userId', 'name email')
      .populate('vehicleId', 'vehicleName vehicleType registrationNumber pricePerDay location');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Ensure the booking belongs to the requesting user
    if (booking.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. This booking does not belong to you.' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Authenticated (owner only)
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Ensure the booking belongs to the requesting user
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. This booking does not belong to you.' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };
