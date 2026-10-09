import bcrypt from 'bcryptjs';
import { query, default as pool } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cleanUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) throw new ApiError(400, 'Links must start with http:// or https://');
  return trimmed;
}

const PROFILE_COLUMNS = `
  id, owner_user_id, business_name, slug, description, phone, email, whatsapp_number,
  website_url, logo_url, cover_image_url, gallery_urls, reviews, instagram_url, facebook_url,
  address, locality, city, state, verified, active, created_at, updated_at
`;

async function offeringsFor(businessId) {
  const result = await query(`
    SELECT bs.id, bs.title, bs.description, bs.price_from, bs.price_to, bs.active,
      bs.district_id, d.name AS district_name, d.state AS district_state,
      s.id AS service_id, s.name AS service_name, s.slug AS service_slug
    FROM business_services bs
    JOIN services s ON s.id = bs.service_id
    LEFT JOIN districts d ON d.id = bs.district_id
    WHERE bs.business_id = $1
    ORDER BY d.name, s.name
  `, [businessId]);
  return result.rows;
}

export const OwnerModel = {
  async bookingsForOwner(userId) {
    const result = await query(`
      SELECT b.id, b.booking_date, b.start_time, b.end_time, b.status, b.created_at,
        u.full_name AS customer_name, u.phone AS customer_phone,
        s.name AS service_name
      FROM bookings b
      INNER JOIN business_profiles bp ON bp.id = b.business_id
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN business_services bs ON bs.id = b.business_service_id
      LEFT JOIN services s ON s.id = bs.service_id
      WHERE bp.owner_user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async availableOptions() {
    const result = await query(`
      SELECT d.id AS district_id, d.name AS district_name, d.state,
        s.id AS service_id, s.name AS service_name, s.slug AS service_slug
      FROM district_services ds
      JOIN districts d ON d.id = ds.district_id AND d.active = true
      JOIN services s ON s.id = ds.service_id AND s.active = true
      WHERE ds.active = true
      ORDER BY d.state, d.name, s.name
    `);
    return result.rows;
  },

  async findProfileByOwner(userId) {
    const result = await query(`SELECT ${PROFILE_COLUMNS} FROM business_profiles WHERE owner_user_id = $1`, [userId]);
    const profile = result.rows[0] || null;
    if (!profile) return null;
    return { ...profile, offerings: await offeringsFor(profile.id) };
  },

  async findPublicBySlug(slug) {
    const result = await query(`
      SELECT ${PROFILE_COLUMNS}
      FROM business_profiles
      WHERE slug = $1 AND active = true
    `, [slug]);
    const profile = result.rows[0] || null;
    if (!profile) return null;
    const offerings = (await offeringsFor(profile.id)).filter((item) => item.active);
    return { ...profile, offerings };
  },

  async saveProfile(userId, input) {
    const name = input.businessName?.trim();
    if (!name) throw new ApiError(400, 'Business name is required');
    const gallery = Array.isArray(input.galleryUrls)
      ? input.galleryUrls.map((item) => cleanUrl(item)).filter(Boolean).slice(0, 4)
      : [];
    const reviews = Array.isArray(input.reviews)
      ? input.reviews.slice(0, 20).map((review) => ({
        id: review.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: String(review.author || '').trim().slice(0, 80),
        text: String(review.text || '').trim().slice(0, 500),
        youtubeUrl: cleanUrl(review.youtubeUrl),
      })).filter((review) => review.author && (review.text || review.youtubeUrl))
      : [];
    if (!input.logoUrl?.trim() || !input.coverImageUrl?.trim() || gallery.length === 0) {
      throw new ApiError(400, 'Logo, cover image, and at least one gallery image link are required');
    }
    const existing = await this.findProfileByOwner(userId);
    const values = [
      name,
      input.description?.trim() || null,
      input.phone?.trim() || null,
      input.whatsappNumber?.trim() || null,
      cleanUrl(input.logoUrl),
      cleanUrl(input.coverImageUrl),
      gallery,
      reviews,
      cleanUrl(input.instagramUrl),
      cleanUrl(input.facebookUrl),
      input.address?.trim() || null,
    ];

    if (existing) {
      await query(`
        UPDATE business_profiles SET
          business_name = $2, description = $3, phone = $4, whatsapp_number = $5,
          logo_url = $6, cover_image_url = $7, gallery_urls = $8, reviews = $9, instagram_url = $10,
          facebook_url = $11, address = $12, updated_at = now()
        WHERE owner_user_id = $1
      `, [userId, ...values]);
      return this.findProfileByOwner(userId);
    }

    let slug = slugify(name) || 'business';
    const taken = await query('SELECT 1 FROM business_profiles WHERE slug = $1 OR slug LIKE $2', [slug, `${slug}-%`]);
    if (taken.rowCount) slug = `${slug}-${taken.rowCount + 1}`;
    await query(`
      INSERT INTO business_profiles
        (owner_user_id, business_name, slug, description, phone, whatsapp_number, logo_url, cover_image_url, gallery_urls, reviews, instagram_url, facebook_url, address, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)
    `, [userId, values[0], slug, ...values.slice(1)]);
    return this.findProfileByOwner(userId);
  },

  async addOffering(userId, { districtId, serviceId, title, description, priceFrom }) {
    const profile = await this.findProfileByOwner(userId);
    if (!profile) throw new ApiError(400, 'Save your business page before adding a service');
    const allowed = await query(`
      SELECT d.name AS district_name, d.state, s.name AS service_name
      FROM district_services ds
      JOIN districts d ON d.id = ds.district_id AND d.active = true
      JOIN services s ON s.id = ds.service_id AND s.active = true
      WHERE ds.active = true AND ds.district_id = $1 AND ds.service_id = $2
    `, [districtId, serviceId]);
    if (!allowed.rows[0]) throw new ApiError(400, 'That service is not available in the selected district');

    await query(`
      INSERT INTO business_services
        (business_id, service_id, title, description, price_from, price_type, active, district, district_id)
      VALUES ($1,$2,$3,$4,$5,'starting_from',true,$6,$7)
      ON CONFLICT (business_id, service_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price_from = EXCLUDED.price_from,
        district = EXCLUDED.district,
        district_id = EXCLUDED.district_id,
        active = true,
        updated_at = now()
    `, [
      profile.id,
      serviceId,
      title?.trim() || allowed.rows[0].service_name,
      description?.trim() || null,
      priceFrom === '' || priceFrom == null ? null : priceFrom,
      allowed.rows[0].district_name,
      districtId,
    ]);
    if (!profile.city) {
      await query(
        'UPDATE business_profiles SET city = $2, state = $3, updated_at = now() WHERE id = $1',
        [profile.id, allowed.rows[0].district_name, allowed.rows[0].state],
      );
    }
    return this.findProfileByOwner(userId);
  },

  async removeOffering(userId, offeringId) {
    const profile = await this.findProfileByOwner(userId);
    if (!profile) throw new ApiError(404, 'Business page not found');
    const removed = await query(
      'DELETE FROM business_services WHERE id = $1 AND business_id = $2 RETURNING id',
      [offeringId, profile.id],
    );
    if (!removed.rows[0]) throw new ApiError(404, 'Service listing not found');
    return this.findProfileByOwner(userId);
  },

  async createBooking({ slug, businessServiceId, customerName, customerPhone }) {
    const name = customerName?.trim();
    const phone = customerPhone?.trim();
    if (!name || name.length < 2) throw new ApiError(400, 'Name is required');
    if (!/^\d{10}$/.test(phone || '')) throw new ApiError(400, 'Enter a 10-digit phone number');

    const site = await this.findPublicBySlug(slug);
    if (!site) throw new ApiError(404, 'Business page not found');
    const offering = site.offerings.find((item) => item.id === businessServiceId);
    if (!offering) throw new ApiError(400, 'Choose one of this business’s services');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query('SELECT id, role FROM users WHERE phone = $1', [phone]);
      let userId = existing.rows[0]?.id;
      if (existing.rows[0]?.role === 'business' || existing.rows[0]?.role === 'admin') {
        throw new ApiError(409, 'This phone number belongs to a business account. Use another number.');
      }
      if (!userId) {
        const passwordHash = await bcrypt.hash(`${phone}-${Date.now()}`, 8);
        const created = await client.query(`
          INSERT INTO users (full_name, email, phone, password_hash, role)
          VALUES ($1, $2, $3, $4, 'user')
          RETURNING id
        `, [name, `guest+${phone}@hiercrow.local`, phone, passwordHash]);
        userId = created.rows[0].id;
      } else {
        await client.query('UPDATE users SET full_name = $2, updated_at = now() WHERE id = $1', [userId, name]);
      }
      const booking = await client.query(`
        INSERT INTO bookings (user_id, business_id, business_service_id, booking_date, status)
        VALUES ($1, $2, $3, CURRENT_DATE, 'pending')
        RETURNING id, status, booking_date, created_at
      `, [userId, site.id, offering.id]);
      await client.query('COMMIT');
      return { ...booking.rows[0], service_name: offering.service_name, business_name: site.business_name };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
