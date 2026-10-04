import { BusinessServiceService } from '../services/businessService.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAllBusinessServices = asyncHandler(async (req, res) => {
  const {
    district,
    minPrice,
    maxPrice,
    priceType,
    serviceId,
    serviceSlug,
    category,
    businessId,
    verifiedOnly,
    search,
    active,
    sortBy,
    page = 1,
    limit = 10,
  } = req.query;

  const result = await BusinessServiceService.getBusinessServices(
    {
      district,
      minPrice,
      maxPrice,
      priceType,
      serviceId,
      serviceSlug,
      category,
      businessId,
      verifiedOnly,
      search,
      active,
      sortBy,
    },
    {
      page,
      limit,
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Business services retrieved successfully'));
});

export const getBusinessServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const businessService = await BusinessServiceService.getBusinessServiceById(id);

  res
    .status(200)
    .json(new ApiResponse(200, businessService, 'Business service retrieved successfully'));
});

export const getAvailableDistricts = asyncHandler(async (req, res) => {
  const districts = await BusinessServiceService.getDistricts();

  res
    .status(200)
    .json(new ApiResponse(200, districts, 'Available districts retrieved successfully'));
});

export const getServicesByBusinessId = asyncHandler(async (req, res) => {
  const { businessId } = req.params;
  const { activeOnly } = req.query;

  const services = await BusinessServiceService.getServicesByBusiness(businessId, {
    activeOnly: activeOnly !== 'false',
  });

  res
    .status(200)
    .json(new ApiResponse(200, services, 'Business services retrieved successfully'));
});
