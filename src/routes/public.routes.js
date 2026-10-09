import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { BusinessServiceService } from '../services/businessService.service.js';
import { OwnerModel } from '../models/owner.model.js';

const router = Router();

// These discovery endpoints intentionally do not use auth middleware.
router.get('/districts', asyncHandler(async (req, res) => {
  const districts = await BusinessServiceService.getDistricts();
  res.status(200).json(new ApiResponse(200, districts, 'Districts retrieved successfully'));
}));

router.get('/districts/:district/services', asyncHandler(async (req, res) => {
  const district = decodeURIComponent(req.params.district).trim();
  if (!district) {
    return res.status(400).json(new ApiResponse(400, null, 'District is required'));
  }

  const services = await BusinessServiceService.getServicesByDistrict(district);
  res.status(200).json(new ApiResponse(200, services, 'Services retrieved successfully'));
}));

router.get('/sites/:slug', asyncHandler(async (req, res) => {
  const site = await OwnerModel.findPublicBySlug(req.params.slug);
  if (!site) return res.status(404).json(new ApiResponse(404, null, 'Business page not found'));
  res.json(new ApiResponse(200, site, 'Business page retrieved successfully'));
}));

router.post('/sites/:slug/book', asyncHandler(async (req, res) => {
  const booking = await OwnerModel.createBooking({ slug: req.params.slug, ...req.body });
  res.status(201).json(new ApiResponse(201, booking, 'Booking request sent'));
}));

router.get('/businesses', asyncHandler(async (req, res) => {
  const { district, service, serviceSlug, page = 1, limit = 100 } = req.query;
  if (!district || (!service && !serviceSlug)) {
    return res.status(400).json(new ApiResponse(400, null, 'District and service are required'));
  }

  const result = await BusinessServiceService.getBusinessServices(
    { district, serviceSlug: serviceSlug || service, active: true },
    { page, limit },
  );
  res.status(200).json(new ApiResponse(200, result, 'Businesses retrieved successfully'));
}));

export default router;
