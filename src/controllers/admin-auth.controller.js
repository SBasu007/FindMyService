import { AdminAuthService } from '../services/admin-auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminSignup = asyncHandler(async (req, res) => {
  res.status(201).json(new ApiResponse(201, await AdminAuthService.signup({ ...req.body, requester: req.user }), 'Admin account created successfully'));
});

export const adminLogin = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, await AdminAuthService.login(req.body), 'Admin login successful'));
});
