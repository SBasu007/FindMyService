import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token has expired. Please log in again.');
    }
    throw new ApiError(401, 'Invalid authentication token');
  }

  const user = await UserModel.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User associated with this token no longer exists');
  }

  if (!user.active) {
    throw new ApiError(403, 'User account is deactivated');
  }

  req.user = user;
  next();
});
