import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';

export const UserService = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  },

  async updateProfile(userId, updates) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Check phone uniqueness if phone is being updated
    if (updates.phone && updates.phone !== user.phone) {
      const existingUserWithPhone = await UserModel.findByPhone(updates.phone);
      if (existingUserWithPhone && existingUserWithPhone.id !== userId) {
        throw new ApiError(409, 'Phone number is already in use by another account');
      }
    }

    const updatedUser = await UserModel.updateProfile(userId, updates);
    return updatedUser;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Both current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters long');
    }

    const user = await UserModel.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(userId, newPasswordHash);

    return { message: 'Password updated successfully' };
  },
};
