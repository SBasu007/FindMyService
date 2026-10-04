import { BusinessServiceModel } from '../models/businessService.model.js';
import { ApiError } from '../utils/ApiError.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const BusinessServiceService = {
  /**
   * Fetch paginated business services with filters.
   */
  async getBusinessServices(filters = {}, pagination = {}) {
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
    } = filters;

    // Validate minPrice and maxPrice if provided
    let parsedMinPrice = minPrice !== undefined ? parseFloat(minPrice) : undefined;
    let parsedMaxPrice = maxPrice !== undefined ? parseFloat(maxPrice) : undefined;

    if (parsedMinPrice !== undefined && isNaN(parsedMinPrice)) {
      throw new ApiError(400, 'minPrice must be a valid number');
    }
    if (parsedMinPrice !== undefined && parsedMinPrice < 0) {
      throw new ApiError(400, 'minPrice cannot be negative');
    }

    if (parsedMaxPrice !== undefined && isNaN(parsedMaxPrice)) {
      throw new ApiError(400, 'maxPrice must be a valid number');
    }
    if (parsedMaxPrice !== undefined && parsedMaxPrice < 0) {
      throw new ApiError(400, 'maxPrice cannot be negative');
    }

    if (
      parsedMinPrice !== undefined &&
      parsedMaxPrice !== undefined &&
      parsedMinPrice > parsedMaxPrice
    ) {
      throw new ApiError(400, 'minPrice cannot be greater than maxPrice');
    }

    // Validate UUIDs if provided
    if (serviceId && !UUID_REGEX.test(serviceId)) {
      throw new ApiError(400, 'Invalid serviceId format');
    }
    if (businessId && !UUID_REGEX.test(businessId)) {
      throw new ApiError(400, 'Invalid businessId format');
    }

    // Validate priceType if provided
    const validPriceTypes = ['fixed', 'starting_from', 'hourly', 'daily', 'monthly', 'custom'];
    if (priceType && !validPriceTypes.includes(priceType)) {
      throw new ApiError(
        400,
        `Invalid priceType. Must be one of: ${validPriceTypes.join(', ')}`
      );
    }

    const { page = 1, limit = 10 } = pagination;

    return await BusinessServiceModel.findAll({
      district,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
      priceType,
      serviceId,
      serviceSlug,
      category,
      businessId,
      verifiedOnly,
      search,
      active,
      sortBy,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
    });
  },

  /**
   * Fetch a single business service by ID.
   */
  async getBusinessServiceById(id) {
    if (!id || !UUID_REGEX.test(id)) {
      throw new ApiError(400, 'Invalid business service ID');
    }

    const businessService = await BusinessServiceModel.findById(id);
    if (!businessService) {
      throw new ApiError(404, 'Business service not found');
    }

    return businessService;
  },

  /**
   * Fetch distinct districts where services/businesses operate.
   */
  async getDistricts() {
    return await BusinessServiceModel.getDistinctDistricts();
  },

  /**
   * Fetch all services by a business ID.
   */
  async getServicesByBusiness(businessId, { activeOnly = true } = {}) {
    if (!businessId || !UUID_REGEX.test(businessId)) {
      throw new ApiError(400, 'Invalid business ID');
    }

    return await BusinessServiceModel.findByBusinessId(businessId, { activeOnly });
  },
};
