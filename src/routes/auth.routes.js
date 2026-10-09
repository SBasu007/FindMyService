import { Router } from 'express';
import { register, login, getMe, registerBusiness, loginBusiness } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/business/register', registerBusiness);
router.post('/business/login', loginBusiness);
router.get('/me', authenticate, getMe);

export default router;
