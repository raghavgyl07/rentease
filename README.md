# RentEase — Vehicle Rental & Booking Management System

A simple, clean RESTful API backend built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**.

---

## Project Structure

```
rentease-backend/
├── controllers/
│   ├── authController.js
│   ├── vehicleController.js
│   └── bookingController.js
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
├── models/
│   ├── User.js
│   ├── Vehicle.js
│   └── Booking.js
├── routes/
│   ├── authRoutes.js
│   ├── vehicleRoutes.js
│   └── bookingRoutes.js
├── .env.example
├── server.js
├── package.json
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string

---

## Setup & Installation

**1. Clone or download the project.**

**2. Install dependencies:**
```bash
npm install
```

**3. Create your `.env` file:**
```bash
cp .env.example .env
```

**4. Edit `.env` with your values:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rentease
JWT_SECRET=your_super_secret_jwt_key_here
```

**5. Start the server:**
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

## Environment Variables

| Variable     | Description                                   | Example                                    |
|--------------|-----------------------------------------------|--------------------------------------------|
| `PORT`       | Port the server listens on                    | `5000`                                     |
| `MONGO_URI`  | MongoDB connection string                     | `mongodb://localhost:27017/rentease`       |
| `JWT_SECRET` | Secret key for signing JWT tokens             | `mySuperSecretKey123`                      |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint           | Access  | Description              |
|--------|--------------------|---------|--------------------------|
| POST   | `/api/auth/register` | Public  | Register a new user      |
| POST   | `/api/auth/login`    | Public  | Login and receive JWT    |

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "Admin"
}
```
> `role` is optional, defaults to `"Customer"`. Pass `"Admin"` to create an admin for testing.

**Login body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

---

### Vehicles — `/api/vehicles`

| Method | Endpoint            | Access     | Description                         |
|--------|---------------------|------------|-------------------------------------|
| POST   | `/api/vehicles`       | Admin only | Add a new vehicle                   |
| GET    | `/api/vehicles`       | Public     | Get all vehicles (search, filter, paginate) |
| GET    | `/api/vehicles/:id`   | Public     | Get single vehicle by ID            |
| PUT    | `/api/vehicles/:id`   | Admin only | Update vehicle                      |
| DELETE | `/api/vehicles/:id`   | Admin only | Delete vehicle                      |

**Query params for GET /api/vehicles:**
- `vehicleName` — case-insensitive partial match
- `vehicleType` — exact match
- `location` — exact match
- `page` — page number (default: 1)
- `limit` — results per page (default: 10)

Example: `GET /api/vehicles?vehicleName=toyota&location=Mumbai&page=1&limit=5`

**Add vehicle body (Admin):**
```json
{
  "vehicleName": "Toyota Innova",
  "vehicleType": "SUV",
  "registrationNumber": "MH12AB1234",
  "seatingCapacity": 7,
  "pricePerDay": 2500,
  "location": "Mumbai"
}
```

---

### Bookings — `/api/bookings`

> All booking routes require `Authorization: Bearer <token>` header.

| Method | Endpoint                   | Access      | Description                       |
|--------|----------------------------|-------------|-----------------------------------|
| POST   | `/api/bookings`              | Authenticated | Create a new booking              |
| GET    | `/api/bookings/my`           | Authenticated | Get all bookings for current user |
| GET    | `/api/bookings/:id`          | Authenticated | Get booking by ID (owner only)    |
| PATCH  | `/api/bookings/:id/cancel`   | Authenticated | Cancel a booking (owner only)     |

**Create booking body:**
```json
{
  "vehicleId": "64abc123...",
  "pickupDate": "2026-12-01",
  "returnDate": "2026-12-05"
}
```

> `numberOfDays` and `totalAmount` are automatically calculated.

---

## Authentication

Include the JWT token in the `Authorization` header for protected routes:

```
Authorization: Bearer <your_token_here>
```

---

## Business Rules

- **Booking dates**: Pickup date cannot be in the past; return date must be after pickup.
- **Availability**: A vehicle with `availabilityStatus: false` cannot be booked.
- **Overlap check**: A vehicle cannot be double-booked for overlapping date ranges.
- **Cancellation**: Cancelling a booking frees up those dates for future bookings.
- **Rate limiting**: Auth routes allow max 20 requests per 15 minutes per IP.
