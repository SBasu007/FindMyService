import { Router } from 'express';
import {
  getAllBusinessServices,
  getBusinessServiceById,
  getAvailableDistricts,
  getServicesByBusinessId,
} from '../controllers/businessService.controller.js';

const router = Router();

// Public routes for fetching business services
router.get('/', getAllBusinessServices);
router.get('/districts', getAvailableDistricts);
router.get('/business/:businessId', getServicesByBusinessId);
router.get('/:id', getBusinessServiceById);

export default router;
