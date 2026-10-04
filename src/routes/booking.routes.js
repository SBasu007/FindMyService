import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { createBooking, getMyBookings } from '../controllers/booking.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', getMyBookings);
router.post('/', createBooking);
export default router;
