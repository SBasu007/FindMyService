import { UserService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await UserService.getProfile(userId);

  res.status(200).json(new ApiResponse(200, user, 'User profile retrieved successfully'));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    fullName,
    phone,
    profileImageUrl,
    address,
    locality,
    pincode,
    city,
    state,
    latitude,
    longitude,
  } = req.body;

  const updatedUser = await UserService.updateProfile(userId, {
    fullName,
    phone,
    profileImageUrl,
    address,
    locality,
    pincode,
    city,
    state,
    latitude,
    longitude,
  });

  res.status(200).json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  const result = await UserService.changePassword(userId, { currentPassword, newPassword });

  res.status(200).json(new ApiResponse(200, result, 'Password changed successfully'));
});
