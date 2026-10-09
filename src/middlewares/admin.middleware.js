import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticateAdmin = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Admin authentication token missing or invalid');
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
  } catch (error) {
    throw new ApiError(401, error.name === 'TokenExpiredError' ? 'Admin token has expired. Please log in again.' : 'Invalid admin authentication token');
  }

  const user = await UserModel.findById(decoded.id);
  if (!user || !user.active) throw new ApiError(401, 'Admin account is unavailable');
  if (user.role !== 'admin') throw new ApiError(403, 'Admin access required');

  req.user = user;
  next();
});

export const optionalAdminAuthentication = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  if (!authHeader.startsWith('Bearer ')) throw new ApiError(401, 'Invalid admin authentication token');
  let decoded;
  try { decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret); }
  catch (_error) { throw new ApiError(401, 'Invalid admin authentication token'); }
  const user = await UserModel.findById(decoded.id);
  if (!user || !user.active || user.role !== 'admin') throw new ApiError(403, 'Admin access required');
  req.user = user;
  next();
});
