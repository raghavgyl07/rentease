const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

// @desc    Add a new vehicle
// @route   POST /api/vehicles
// @access  Admin only
const addVehicle = async (req, res, next) => {
  try {
    const {
      vehicleName,
      vehicleType,
      registrationNumber,
      seatingCapacity,
      pricePerDay,
      location,
      availabilityStatus,
    } = req.body;

    // Validate required fields
    if (!vehicleName || !vehicleName.trim()) {
      return res.status(400).json({ message: 'Vehicle name is required.' });
    }
    if (!vehicleType || !vehicleType.trim()) {
      return res.status(400).json({ message: 'Vehicle type is required.' });
    }
    if (!registrationNumber || !registrationNumber.trim()) {
      return res.status(400).json({ message: 'Registration number is required.' });
    }
    if (!seatingCapacity || seatingCapacity < 1) {
      return res.status(400).json({ message: 'Seating capacity must be at least 1.' });
    }
    if (!pricePerDay || pricePerDay <= 0) {
      return res.status(400).json({ message: 'Price per day must be greater than 0.' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ message: 'Location is required.' });
    }

    const vehicle = await Vehicle.create({
      vehicleName: vehicleName.trim(),
      vehicleType: vehicleType.trim(),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      seatingCapacity,
      pricePerDay,
      location: location.trim(),
      availabilityStatus: availabilityStatus !== undefined ? availabilityStatus : true,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully.',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vehicles with search, filter, and pagination
// @route   GET /api/vehicles
// @access  Public
const getAllVehicles = async (req, res, next) => {
  try {
    const { vehicleName, vehicleType, location, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (vehicleName) {
      filter.vehicleName = { $regex: vehicleName.trim(), $options: 'i' };
    }
    if (vehicleType) {
      filter.vehicleType = vehicleType.trim();
    }
    if (location) {
      filter.location = location.trim();
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Vehicle.countDocuments(filter);
    const vehicles = await Vehicle.find(filter)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vehicle ID.' });
    }

    const vehicle = await Vehicle.findById(id).populate('createdBy', 'name email');
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Admin only
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vehicle ID.' });
    }

    // Validate pricePerDay if provided
    if (req.body.pricePerDay !== undefined && req.body.pricePerDay <= 0) {
      return res.status(400).json({ message: 'Price per day must be greater than 0.' });
    }

    // Trim string fields if present
    const allowedFields = [
      'vehicleName',
      'vehicleType',
      'registrationNumber',
      'seatingCapacity',
      'pricePerDay',
      'location',
      'availabilityStatus',
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] =
          typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    if (updateData.registrationNumber) {
      updateData.registrationNumber = updateData.registrationNumber.toUpperCase();
    }

    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Admin only
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid vehicle ID.' });
    }

    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addVehicle, getAllVehicles, getVehicleById, updateVehicle, deleteVehicle };
