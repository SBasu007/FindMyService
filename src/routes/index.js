import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import businessServiceRoutes from './businessService.routes.js';
import publicRoutes from './public.routes.js';
import adminRoutes from './admin.routes.js';
import bookingRoutes from './booking.routes.js';

const router = Router();

// Mount route modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/business-services', businessServiceRoutes);
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);
router.use('/bookings', bookingRoutes);

export default router;
