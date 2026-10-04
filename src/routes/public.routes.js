import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { BusinessServiceService } from '../services/businessService.service.js';

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
