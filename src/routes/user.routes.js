import { Router } from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// All user routes are protected
router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.patch('/change-password', changePassword);

export default router;
