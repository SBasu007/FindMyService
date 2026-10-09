import { query } from '../config/db.js';

const SAFE_USER_COLUMNS = `
  id,
  role,
  full_name,
  email,
  phone,
  profile_image_url,
  address,
  locality,
  pincode,
  city,
  state,
  latitude,
  longitude,
  active,
  created_at,
  updated_at
`;

export const UserModel = {
  async countAdmins() {
    const result = await query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`);
    return result.rows[0]?.count || 0;
  },

  async create({
    fullName,
    email,
    phone = null,
    passwordHash,
    role = 'user',
    profileImageUrl = null,
    address = null,
    locality = null,
    pincode = null,
    city = null,
    state = null,
    latitude = null,
    longitude = null,
  }) {
    const text = `
      INSERT INTO users (
        full_name,
        email,
        phone,
        password_hash,
        role,
        profile_image_url,
        address,
        locality,
        pincode,
        city,
        state,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING ${SAFE_USER_COLUMNS}
    `;

    const values = [
      fullName,
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      passwordHash,
      role,
      profileImageUrl,
      address,
      locality,
      pincode,
      city,
      state,
      latitude,
      longitude,
    ];

    const result = await query(text, values);
    return result.rows[0];
  },

  async findByEmail(email) {
    const text = `
      SELECT id, role, full_name, email, phone, password_hash, profile_image_url,
             address, locality, pincode, city, state, latitude, longitude,
             active, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `;
    const result = await query(text, [email.trim()]);
    return result.rows[0] || null;
  },

  async findByPhone(phone) {
    const text = `
      SELECT ${SAFE_USER_COLUMNS}
      FROM users
      WHERE phone = $1
    `;
    const result = await query(text, [phone.trim()]);
    return result.rows[0] || null;
  },

  async findByPhoneWithPassword(phone) {
    const text = `
      SELECT id, role, full_name, email, phone, password_hash, profile_image_url,
             address, locality, pincode, city, state, latitude, longitude,
             active, created_at, updated_at
      FROM users
      WHERE phone = $1
    `;
    const result = await query(text, [phone.trim()]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const text = `
      SELECT ${SAFE_USER_COLUMNS}
      FROM users
      WHERE id = $1
    `;
    const result = await query(text, [id]);
    return result.rows[0] || null;
  },

  async findByIdWithPassword(id) {
    const text = `
      SELECT id, role, full_name, email, password_hash, active
      FROM users
      WHERE id = $1
    `;
    const result = await query(text, [id]);
    return result.rows[0] || null;
  },

  async updateProfile(id, updates) {
    const fieldMap = {
      fullName: 'full_name',
      phone: 'phone',
      profileImageUrl: 'profile_image_url',
      address: 'address',
      locality: 'locality',
      pincode: 'pincode',
      city: 'city',
      state: 'state',
      latitude: 'latitude',
      longitude: 'longitude',
    };

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, dbColumn] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${dbColumn} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const text = `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING ${SAFE_USER_COLUMNS}
    `;

    const result = await query(text, values);
    return result.rows[0] || null;
  },

  async updatePassword(id, newPasswordHash) {
    const text = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, full_name, email, updated_at
    `;
    const result = await query(text, [newPasswordHash, id]);
    return result.rows[0] || null;
  },
};
