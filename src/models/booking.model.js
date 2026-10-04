import { query } from '../config/db.js';

export const BookingModel = {
  async findByUserId(userId) {
    const result = await query(`
      SELECT b.id, b.booking_date, b.start_time, b.end_time, b.status, b.created_at,
        s.id AS service_id, s.name AS service_name,
        bp.business_name, bp.logo_url, bp.city, bp.state
      FROM bookings b
      INNER JOIN business_services bs ON bs.id = b.business_service_id
      INNER JOIN services s ON s.id = bs.service_id
      INNER JOIN business_profiles bp ON bp.id = b.business_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [userId]);
    return result.rows;
  },

  async create({ userId, businessServiceId, serviceId, customerName, customerPhone, bookingTime }) {
    await query(`UPDATE users SET full_name = $1, phone = $2, updated_at = now() WHERE id = $3`, [customerName.trim(), customerPhone.trim(), userId]);
    const service = await query(`
      SELECT bs.business_id, bs.service_id, s.name AS service_name
      FROM business_services bs
      INNER JOIN services s ON s.id = bs.service_id
      WHERE bs.id = $1 AND bs.service_id = $2 AND bs.active = true AND s.active = true
    `, [businessServiceId, serviceId]);
    if (!service.rows[0]) return null;
    const [hours, minutes] = bookingTime.split(':').map(Number);
    const endDate = new Date(2000, 0, 1, hours, minutes + 60);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    const result = await query(`
      INSERT INTO bookings
        (user_id, business_id, business_service_id, booking_date, start_time, end_time, service_address, locality, pincode, customer_notes, status)
      VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,NULL,NULL,NULL,NULL,'pending')
      RETURNING id, business_id, business_service_id, booking_date, start_time, end_time, status, created_at
    `, [userId, service.rows[0].business_id, businessServiceId, bookingTime, endTime]);
    return { ...result.rows[0], service_id: service.rows[0].service_id, service_name: service.rows[0].service_name, booking_time: bookingTime };
  },
};
