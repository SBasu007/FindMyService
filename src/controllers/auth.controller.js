import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    profileImageUrl,
    address,
    locality,
    pincode,
    city,
    state,
    latitude,
    longitude,
  } = req.body;

  const result = await AuthService.register({
    fullName,
    email,
    phone,
    password,
    profileImageUrl,
    address,
    locality,
    pincode,
    city,
    state,
    latitude,
    longitude,
  });

  res.status(201).json(new ApiResponse(201, result, 'User registered successfully'));
});

export const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const result = await AuthService.login({ phone, password });

  res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

export const registerBusiness = asyncHandler(async (req, res) => {
  const result = await AuthService.registerBusiness(req.body);
  res.status(201).json(new ApiResponse(201, result, 'Business account created'));
});

export const loginBusiness = asyncHandler(async (req, res) => {
  const result = await AuthService.loginBusiness(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Business login successful'));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, 'Current user profile fetched successfully'));
});
