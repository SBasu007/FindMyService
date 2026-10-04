import { query, default as pool } from '../config/db.js';

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export const AdminModel = {
  async listDistricts() {
    const result = await query(`
      SELECT d.id, d.name, d.state, d.active, d.created_at,
        COUNT(DISTINCT ds.service_id)::int AS service_count,
        COUNT(DISTINCT bs.business_id)::int AS organization_count
      FROM districts d
      LEFT JOIN district_services ds ON ds.district_id = d.id AND ds.active = true
      LEFT JOIN business_services bs ON bs.district_id = d.id AND bs.active = true
      GROUP BY d.id
      ORDER BY d.state, d.name
    `);
    return result.rows;
  },

  async createDistrict({ name, state }) {
    const result = await query(
      `INSERT INTO districts (name, state) VALUES ($1, $2) RETURNING *`,
      [name.trim(), state.trim()],
    );
    return result.rows[0];
  },

  async updateDistrict(id, { name, state, active }) {
    const result = await query(
      `UPDATE districts SET name = COALESCE($2, name), state = COALESCE($3, state), active = COALESCE($4, active), updated_at = now() WHERE id = $1 RETURNING *`,
      [id, name?.trim() || null, state?.trim() || null, active ?? null],
    );
    return result.rows[0] || null;
  },

  async deleteDistrict(id) {
    const result = await query('DELETE FROM districts WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },

  async listServices() {
    const result = await query(`
      SELECT s.id, s.name, s.slug, s.description, s.category, s.active,
        COUNT(DISTINCT ds.district_id)::int AS district_count
      FROM services s
      LEFT JOIN district_services ds ON ds.service_id = s.id AND ds.active = true
      GROUP BY s.id
      ORDER BY s.name
    `);
    return result.rows;
  },

  async createService({ name, slug, description, category }) {
    const result = await query(
      `INSERT INTO services (name, slug, description, category) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), slugify(slug || name), description?.trim() || null, category?.trim() || null],
    );
    return result.rows[0];
  },

  async assignService(districtId, serviceId) {
    const result = await query(`
      INSERT INTO district_services (district_id, service_id, active)
      VALUES ($1, $2, true)
      ON CONFLICT (district_id, service_id) DO UPDATE SET active = true
      RETURNING *
    `, [districtId, serviceId]);
    return result.rows[0];
  },

  async removeService(districtId, serviceId) {
    const result = await query(
      'DELETE FROM district_services WHERE district_id = $1 AND service_id = $2 RETURNING *',
      [districtId, serviceId],
    );
    return result.rows[0] || null;
  },

  async listOrganizations() {
    const result = await query(`
      SELECT bp.*, COUNT(DISTINCT bs.service_id)::int AS service_count
      FROM business_profiles bp
      LEFT JOIN business_services bs ON bs.business_id = bp.id
      GROUP BY bp.id
      ORDER BY bp.created_at DESC
    `);
    return result.rows;
  },

  async createOrganization(input) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const profile = await client.query(`
        INSERT INTO business_profiles
          (business_name, description, phone, email, whatsapp_number, website_url, logo_url, address, locality, pincode, city, state, verified, active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)
        RETURNING *
      `, [
        input.businessName.trim(), input.description?.trim() || null, input.phone?.trim() || null,
        input.email?.trim() || null, input.whatsappNumber?.trim() || null, input.websiteUrl?.trim() || null, input.logoUrl?.trim() || null,
        input.address?.trim() || null, input.locality?.trim() || null, input.pincode?.trim() || null,
        input.city?.trim() || null, input.state?.trim() || null, input.verified === true,
      ]);
      const business = profile.rows[0];

      for (const item of input.services) {
        const district = await client.query('SELECT id, name FROM districts WHERE id = $1 AND active = true', [item.districtId]);
        if (!district.rows[0]) throw new Error('District not found or inactive');
        await client.query(`
          INSERT INTO district_services (district_id, service_id, active)
          VALUES ($1, $2, true)
          ON CONFLICT (district_id, service_id) DO UPDATE SET active = true
        `, [item.districtId, item.serviceId]);
        await client.query(`
          INSERT INTO business_services (business_id, service_id, title, description, price_from, price_to, price_type, active, district, district_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9)
        `, [
          business.id, item.serviceId, item.title?.trim() || null, item.description?.trim() || null,
          item.priceFrom ?? null, item.priceTo ?? null, item.priceType || 'starting_from',
          district.rows[0].name, item.districtId,
        ]);
      }

      await client.query('COMMIT');
      return business;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
