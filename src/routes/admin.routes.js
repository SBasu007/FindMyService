import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AdminModel } from '../models/admin.model.js';

const router = Router();

router.get('/districts', asyncHandler(async (_req, res) => {
  res.json(new ApiResponse(200, await AdminModel.listDistricts(), 'Districts retrieved successfully'));
}));

router.post('/districts', asyncHandler(async (req, res) => {
  const { name, state } = req.body;
  if (!name?.trim() || !state?.trim()) return res.status(400).json(new ApiResponse(400, null, 'Name and state are required'));
  res.status(201).json(new ApiResponse(201, await AdminModel.createDistrict({ name, state }), 'District created successfully'));
}));

router.patch('/districts/:id', asyncHandler(async (req, res) => {
  const district = await AdminModel.updateDistrict(req.params.id, req.body);
  if (!district) return res.status(404).json(new ApiResponse(404, null, 'District not found'));
  res.json(new ApiResponse(200, district, 'District updated successfully'));
}));

router.delete('/districts/:id', asyncHandler(async (req, res) => {
  const district = await AdminModel.deleteDistrict(req.params.id);
  if (!district) return res.status(404).json(new ApiResponse(404, null, 'District not found'));
  res.json(new ApiResponse(200, district, 'District deleted successfully'));
}));

router.get('/services', asyncHandler(async (_req, res) => {
  res.json(new ApiResponse(200, await AdminModel.listServices(), 'Services retrieved successfully'));
}));

router.post('/services', asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json(new ApiResponse(400, null, 'Service name is required'));
  res.status(201).json(new ApiResponse(201, await AdminModel.createService(req.body), 'Service created successfully'));
}));

router.post('/districts/:districtId/services', asyncHandler(async (req, res) => {
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json(new ApiResponse(400, null, 'serviceId is required'));
  res.status(201).json(new ApiResponse(201, await AdminModel.assignService(req.params.districtId, serviceId), 'Service assigned to district'));
}));

router.delete('/districts/:districtId/services/:serviceId', asyncHandler(async (req, res) => {
  const removed = await AdminModel.removeService(req.params.districtId, req.params.serviceId);
  if (!removed) return res.status(404).json(new ApiResponse(404, null, 'District service assignment not found'));
  res.json(new ApiResponse(200, removed, 'Service removed from district'));
}));

router.get('/organizations', asyncHandler(async (_req, res) => {
  res.json(new ApiResponse(200, await AdminModel.listOrganizations(), 'Organizations retrieved successfully'));
}));

router.post('/organizations', asyncHandler(async (req, res) => {
  const { businessName, services } = req.body;
  if (!businessName?.trim() || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, 'Business name and at least one district service are required'));
  }
  res.status(201).json(new ApiResponse(201, await AdminModel.createOrganization(req.body), 'Organization created successfully'));
}));

export default router;
