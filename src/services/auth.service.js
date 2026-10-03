import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.config.js';

export const AuthService = {
  generateToken(userId) {
    return jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  },

  async register({
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
  }) {
    if (!fullName || !email || !password) {
      throw new ApiError(400, 'Full name, email, and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingEmail = await UserModel.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new ApiError(409, 'User with this email already exists');
    }

    // Check if phone already exists if provided
    if (phone) {
      const existingPhone = await UserModel.findByPhone(phone.trim());
      if (existingPhone) {
        throw new ApiError(409, 'User with this phone number already exists');
      }
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in database
    const user = await UserModel.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone,
      passwordHash,
      profileImageUrl,
      address,
      locality,
      pincode,
      city,
      state,
      latitude,
      longitude,
    });

    const token = this.generateToken(user.id);

    return { user, token };
  },

  async login({ email, password }) {
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await UserModel.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.active) {
      throw new ApiError(403, 'Account is deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = this.generateToken(user.id);

    // Omit password_hash from response
    const { password_hash, ...safeUser } = user;

    return { user: safeUser, token };
  },
};
