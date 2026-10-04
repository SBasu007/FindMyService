import { BookingModel } from '../models/booking.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMyBookings = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, await BookingModel.findByUserId(req.user.id), 'Bookings retrieved successfully'));
});

export const createBooking = asyncHandler(async (req, res) => {
  const { businessServiceId, serviceId, customerName, customerPhone, bookingTime } = req.body;
  if (!businessServiceId || !serviceId || !customerName?.trim() || !customerPhone?.trim() || !bookingTime) {
    throw new ApiError(400, 'Service, name, phone number, and booking time are required');
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(bookingTime)) throw new ApiError(400, 'Booking time must use HH:MM format');
  const booking = await BookingModel.create({ userId: req.user.id, businessServiceId, serviceId, customerName, customerPhone, bookingTime });
  if (!booking) throw new ApiError(404, 'This service is no longer available');
  res.status(201).json(new ApiResponse(201, booking, 'Booking created successfully'));
});
