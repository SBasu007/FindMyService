import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { OwnerModel } from '../models/owner.model.js';

const router = Router();

router.use(authenticate);
router.use((req, _res, next) => {
  if (req.user.role !== 'business') return next(new ApiError(403, 'Business login required'));
  next();
});

router.get('/studio', asyncHandler(async (req, res) => {
  const [profile, options] = await Promise.all([
    OwnerModel.findProfileByOwner(req.user.id),
    OwnerModel.availableOptions(),
  ]);
  res.json(new ApiResponse(200, { user: req.user, profile, options }, 'Business studio loaded'));
}));

router.get('/bookings', asyncHandler(async (req, res) => {
  const bookings = await OwnerModel.bookingsForOwner(req.user.id);
  res.json(new ApiResponse(200, bookings, 'Business bookings loaded'));
}));

router.put('/profile', asyncHandler(async (req, res) => {
  const profile = await OwnerModel.saveProfile(req.user.id, req.body);
  res.json(new ApiResponse(200, profile, 'Business page saved'));
}));

router.post('/offerings', asyncHandler(async (req, res) => {
  const profile = await OwnerModel.addOffering(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, profile, 'Service added to your page'));
}));

router.delete('/offerings/:id', asyncHandler(async (req, res) => {
  const profile = await OwnerModel.removeOffering(req.user.id, req.params.id);
  res.json(new ApiResponse(200, profile, 'Service removed from your page'));
}));

export default router;
