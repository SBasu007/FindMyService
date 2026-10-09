import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.config.js';

export const AdminAuthService = {
  token(userId) {
    return jwt.sign({ id: userId, role: 'admin' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  },
  async signup({ fullName, phone, password, requester }) {
    const adminCount = await UserModel.countAdmins();
    if (adminCount > 0 && requester?.role !== 'admin') throw new ApiError(403, 'Only an existing admin can create another admin account');
    if (!fullName?.trim() || !phone?.trim() || !password) throw new ApiError(400, 'Name, phone number, and password are required');
    if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters long');
    if (await UserModel.findByPhone(phone.trim())) throw new ApiError(409, 'An account with this phone number already exists');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ fullName: fullName.trim(), email: `admin-${phone.trim()}@hiercrow.local`, phone: phone.trim(), passwordHash, role: 'admin' });
    return { user, token: this.token(user.id) };
  },
  async login({ phone, password }) {
    const user = await UserModel.findByPhoneWithPassword(phone || '');
    if (!user || user.role !== 'admin' || !(await bcrypt.compare(password || '', user.password_hash))) throw new ApiError(401, 'Invalid admin phone number or password');
    if (!user.active) throw new ApiError(403, 'Admin account is deactivated');
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token: this.token(user.id) };
  },
};
