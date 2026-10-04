import { query } from '../config/db.js';

export const BusinessServiceModel = {
  /**
   * Find all business services with joined business profile and service details based on filter and pagination options.
   */
  async findAll({
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
    active = true,
    sortBy = 'newest',
    page = 1,
    limit = 10,
  } = {}) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Active status filter
    if (active !== undefined && active !== null && active !== '') {
      const isActive = active === true || active === 'true';
      conditions.push(`bs.active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;

      // Also ensure business profile is active when filtering for active services
      if (isActive) {
        conditions.push(`bp.active = true`);
      }
    }

    // District filter (checks business_services.district, or falls back to profile city/state/locality)
    if (district && district.trim()) {
      const districtTerm = `%${district.trim()}%`;
      conditions.push(`(
        bs.district ILIKE $${paramIndex}
        OR bp.locality ILIKE $${paramIndex}
        OR bp.city ILIKE $${paramIndex}
        OR bp.state ILIKE $${paramIndex}
      )`);
      values.push(districtTerm);
      paramIndex++;
    }

    // Price filters
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      const numMin = Number(minPrice);
      if (!isNaN(numMin)) {
        conditions.push(`(
          (bs.price_from IS NOT NULL AND bs.price_from >= $${paramIndex})
          OR (bs.price_from IS NULL AND bs.price_to IS NOT NULL AND bs.price_to >= $${paramIndex})
        )`);
        values.push(numMin);
        paramIndex++;
      }
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      const numMax = Number(maxPrice);
      if (!isNaN(numMax)) {
        conditions.push(`(
          (bs.price_to IS NOT NULL AND bs.price_to <= $${paramIndex})
          OR (bs.price_to IS NULL AND bs.price_from IS NOT NULL AND bs.price_from <= $${paramIndex})
        )`);
        values.push(numMax);
        paramIndex++;
      }
    }

    // Price type filter
    if (priceType && priceType.trim()) {
      conditions.push(`bs.price_type = $${paramIndex}`);
      values.push(priceType.trim());
      paramIndex++;
    }

    // Service ID filter
    if (serviceId && serviceId.trim()) {
      conditions.push(`bs.service_id = $${paramIndex}`);
      values.push(serviceId.trim());
      paramIndex++;
    }

    // Service Slug filter
    if (serviceSlug && serviceSlug.trim()) {
      conditions.push(`s.slug = $${paramIndex}`);
      values.push(serviceSlug.trim().toLowerCase());
      paramIndex++;
    }

    // Category filter
    if (category && category.trim()) {
      conditions.push(`s.category ILIKE $${paramIndex}`);
      values.push(`%${category.trim()}%`);
      paramIndex++;
    }

    // Business ID filter
    if (businessId && businessId.trim()) {
      conditions.push(`bs.business_id = $${paramIndex}`);
      values.push(businessId.trim());
      paramIndex++;
    }

    // Verified business filter
    if (verifiedOnly === true || verifiedOnly === 'true') {
      conditions.push(`bp.verified = true`);
    }

    // Keyword Search (searches in service title, service description, business name, or master service name)
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(`(
        bs.title ILIKE $${paramIndex}
        OR bs.description ILIKE $${paramIndex}
        OR bp.business_name ILIKE $${paramIndex}
        OR s.name ILIKE $${paramIndex}
      )`);
      values.push(searchTerm);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting options
    let orderByClause;
    switch (sortBy) {
      case 'price_asc':
        orderByClause = 'ORDER BY COALESCE(bs.price_from, bs.price_to, 0) ASC, bs.created_at DESC';
        break;
      case 'price_desc':
        orderByClause = 'ORDER BY COALESCE(bs.price_to, bs.price_from, 0) DESC, bs.created_at DESC';
        break;
      case 'oldest':
        orderByClause = 'ORDER BY bs.created_at ASC';
        break;
      case 'title_asc':
        orderByClause = 'ORDER BY COALESCE(bs.title, s.name) ASC';
        break;
      case 'newest':
      default:
        orderByClause = 'ORDER BY bs.created_at DESC';
        break;
    }

    // Count total matching items
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM business_services bs
      INNER JOIN business_profiles bp ON bs.business_id = bp.id
      LEFT JOIN services s ON bs.service_id = s.id
      ${whereClause}
    `;

    const countResult = await query(countSql, values);
    const total = countResult.rows[0]?.total || 0;

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;
    const totalPages = Math.ceil(total / limitNum);

    // Fetch data with embedded business_profile and master service
    const dataSql = `
      SELECT 
        bs.id,
        bs.business_id,
        bs.service_id,
        bs.title,
        bs.description,
        bs.price_from,
        bs.price_to,
        bs.price_type,
        bs.district,
        bs.active,
        bs.created_at,
        bs.updated_at,
        json_build_object(
          'id', bp.id,
          'business_name', bp.business_name,
          'description', bp.description,
          'phone', bp.phone,
          'email', bp.email,
          'whatsapp_number', bp.whatsapp_number,
          'website_url', bp.website_url,
          'logo_url', bp.logo_url,
          'cover_image_url', bp.cover_image_url,
          'address', bp.address,
          'locality', bp.locality,
          'pincode', bp.pincode,
          'city', bp.city,
          'state', bp.state,
          'latitude', bp.latitude,
          'longitude', bp.longitude,
          'verified', bp.verified,
          'active', bp.active
        ) AS business_profile,
        CASE 
          WHEN s.id IS NOT NULL THEN
            json_build_object(
              'id', s.id,
              'name', s.name,
              'slug', s.slug,
              'description', s.description,
              'category', s.category,
              'image_url', s.image_url,
              'active', s.active
            )
          ELSE NULL
        END AS service
      FROM business_services bs
      INNER JOIN business_profiles bp ON bs.business_id = bp.id
      LEFT JOIN services s ON bs.service_id = s.id
      ${whereClause}
      ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataValues = [...values, limitNum, offset];
    const result = await query(dataSql, dataValues);

    return {
      businessServices: result.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  },

  /**
   * Find a single business service by ID with complete business profile and service info.
   */
  async findById(id) {
    const text = `
      SELECT 
        bs.id,
        bs.business_id,
        bs.service_id,
        bs.title,
        bs.description,
        bs.price_from,
        bs.price_to,
        bs.price_type,
        bs.district,
        bs.active,
        bs.created_at,
        bs.updated_at,
        json_build_object(
          'id', bp.id,
          'business_name', bp.business_name,
          'description', bp.description,
          'phone', bp.phone,
          'email', bp.email,
          'whatsapp_number', bp.whatsapp_number,
          'website_url', bp.website_url,
          'logo_url', bp.logo_url,
          'cover_image_url', bp.cover_image_url,
          'address', bp.address,
          'locality', bp.locality,
          'pincode', bp.pincode,
          'city', bp.city,
          'state', bp.state,
          'latitude', bp.latitude,
          'longitude', bp.longitude,
          'verified', bp.verified,
          'active', bp.active
        ) AS business_profile,
        CASE 
          WHEN s.id IS NOT NULL THEN
            json_build_object(
              'id', s.id,
              'name', s.name,
              'slug', s.slug,
              'description', s.description,
              'category', s.category,
              'image_url', s.image_url,
              'active', s.active
            )
          ELSE NULL
        END AS service
      FROM business_services bs
      INNER JOIN business_profiles bp ON bs.business_id = bp.id
      LEFT JOIN services s ON bs.service_id = s.id
      WHERE bs.id = $1
    `;

    const result = await query(text, [id]);
    return result.rows[0] || null;
  },

  /**
   * Retrieve distinct available districts from active business services and profiles.
   */
  async getDistinctDistricts() {
    const text = `
      SELECT DISTINCT district
      FROM (
        SELECT bs.district AS district
        FROM business_services bs
        INNER JOIN business_profiles bp ON bs.business_id = bp.id
        WHERE bs.district IS NOT NULL 
          AND TRIM(bs.district) != ''
          AND bs.active = true
          AND bp.active = true
        UNION
        SELECT bp.city AS district
        FROM business_profiles bp
        WHERE bp.city IS NOT NULL 
          AND TRIM(bp.city) != ''
          AND bp.active = true
      ) AS districts
      ORDER BY district ASC
    `;

    const result = await query(text);
    return result.rows.map((row) => row.district);
  },

  /**
   * Get all services offered by a specific business.
   */
  async findByBusinessId(businessId, { activeOnly = true } = {}) {
    const conditions = ['bs.business_id = $1'];
    const values = [businessId];

    if (activeOnly) {
      conditions.push('bs.active = true');
    }

    const text = `
      SELECT 
        bs.id,
        bs.business_id,
        bs.service_id,
        bs.title,
        bs.description,
        bs.price_from,
        bs.price_to,
        bs.price_type,
        bs.district,
        bs.active,
        bs.created_at,
        bs.updated_at,
        CASE 
          WHEN s.id IS NOT NULL THEN
            json_build_object(
              'id', s.id,
              'name', s.name,
              'slug', s.slug,
              'description', s.description,
              'category', s.category,
              'image_url', s.image_url
            )
          ELSE NULL
        END AS service
      FROM business_services bs
      LEFT JOIN services s ON bs.service_id = s.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY bs.created_at DESC
    `;

    const result = await query(text, values);
    return result.rows;
  },
};
