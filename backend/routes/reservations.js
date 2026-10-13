const { query, withClient } = require('../db');
const { config } = require('../config');

/**
 * Find smallest available table for party size
 * Checks for overlapping reservations (2-hour window)
 */
async function findAvailableTable(bookingDate, bookingTime, partySize, client) {
  // Simplified availability check for SQLite
  const sql = `
    SELECT t.id, t.table_code, t.capacity
    FROM restaurant_tables t
    WHERE t.capacity >= $1
      AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.table_id = t.id
          AND r.booking_date = $2
          AND r.booking_time = $3
          AND r.status IN ('confirmed', 'occupied')
      )
    ORDER BY t.capacity ASC, t.table_code ASC
    LIMIT 1
  `;
  
  const result = client ? await client.query(sql, [partySize, bookingDate, bookingTime]) : await query(sql, [partySize, bookingDate, bookingTime]);
  return result.rows[0] || null;
}

/**
 * Check availability for given date/time/party size
 * GET /api/availability/check?date=2024-01-15&time=18:00&partySize=4
 */
async function checkAvailability(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const date = url.searchParams.get('date');
  const time = url.searchParams.get('time');
  const partySize = parseInt(url.searchParams.get('partySize'), 10);

  if (!date || !time || !partySize || partySize < 1) {
    return { status: 400, body: { error: 'Missing or invalid parameters' } };
  }

  const table = await findAvailableTable(date, time, partySize);
  
  return {
    status: 200,
    body: {
      available: !!table,
      table: table ? { code: table.table_code, capacity: table.capacity } : null,
      message: table 
        ? `Table ${table.table_code} (capacity ${table.capacity}) available`
        : 'No tables available for this time slot'
    }
  };
}

/**
 * Create new reservation
 * POST /api/reservations
 * Body: { name, phone, bookingDate, bookingTime, partySize, dietaryPreference?, specialRequests? }
 */
async function createReservation(req, res, body) {
  const { name, phone, bookingDate, bookingTime, partySize, dietaryPreference, specialRequests } = body;

  // Validation
  if (!name || !phone || !bookingDate || !bookingTime || !partySize) {
    return { status: 400, body: { error: 'Missing required fields' } };
  }

  if (partySize < 1 || partySize > 20) {
    return { status: 400, body: { error: 'Party size must be between 1 and 20' } };
  }

  if (!/^\d{10,15}$/.test(phone.replace(/[\s\-]/g, ''))) {
    return { status: 400, body: { error: 'Invalid phone number' } };
  }

  return withClient(async (client) => {
    await client.query('BEGIN');

    try {
      // Find available table
      const table = await findAvailableTable(bookingDate, bookingTime, partySize, client);
      
      if (!table) {
        await client.query('ROLLBACK');
        return { 
          status: 409, 
          body: { error: 'No tables available for this time slot', available: false } 
        };
      }

      // Insert or get customer
      const customerSql = `
        INSERT INTO customers (name, phone)
        VALUES ($1, $2)
        ON CONFLICT (phone) DO UPDATE SET name = $1
        RETURNING id
      `;
      const customerResult = await client.query(customerSql, [name, phone]);
      const customerId = customerResult.rows[0].id;

      // Create reservation
      const reservationSql = `
        INSERT INTO reservations (
          customer_id, table_id, booking_date, booking_time, 
          duration_minutes, party_size, dietary_preference, special_requests
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, booking_date, booking_time, status
      `;
      const reservationResult = await client.query(reservationSql, [
        customerId,
        table.id,
        bookingDate,
        bookingTime,
        config.restaurant.reservationDurationMinutes,
        partySize,
        dietaryPreference || null,
        specialRequests || null
      ]);

      await client.query('COMMIT');

      const reservation = reservationResult.rows[0];
      return {
        status: 201,
        body: {
          success: true,
          reservation: {
            id: reservation.id,
            tableCode: table.table_code,
            tableCapacity: table.capacity,
            bookingDate: reservation.booking_date,
            bookingTime: reservation.booking_time,
            status: reservation.status
          },
          message: `Reservation confirmed! Table ${table.table_code} reserved for ${partySize} guests.`
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Reservation creation error:', err);
      return { status: 500, body: { error: 'Failed to create reservation' } };
    }
  });
}

/**
 * Get reservations for POS (filtered by date/time/status)
 * GET /api/pos/reservations?date=2024-01-15&time=18:00&status=confirmed
 */
async function getPOSReservations(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const date = url.searchParams.get('date');
  const time = url.searchParams.get('time');
  const status = url.searchParams.get('status');

  let sql = `
    SELECT 
      r.id, r.booking_date, r.booking_time, r.duration_minutes, 
      r.party_size, r.status, r.dietary_preference, r.special_requests,
      t.table_code, t.capacity,
      c.name as customer_name, c.phone as customer_phone
    FROM reservations r
    JOIN restaurant_tables t ON r.table_id = t.id
    JOIN customers c ON r.customer_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramCount = 1;

  if (date) {
    sql += ` AND r.booking_date = $${paramCount}`;
    params.push(date);
    paramCount++;
  }

  if (time) {
    sql += ` AND r.booking_time = $${paramCount}`;
    params.push(time);
    paramCount++;
  }

  if (status) {
    sql += ` AND r.status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  sql += ` ORDER BY r.booking_date DESC, r.booking_time DESC, t.table_code ASC`;

  const result = await query(sql, params);
  
  return {
    status: 200,
    body: { reservations: result.rows }
  };
}

/**
 * Get table status for specific date/time
 * GET /api/pos/tables?date=2024-01-15&time=18:00
 */
async function getTableStatus(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const date = url.searchParams.get('date');
  const time = url.searchParams.get('time');

  if (!date || !time) {
    return { status: 400, body: { error: 'Date and time required' } };
  }

  const sql = `
    SELECT 
      t.id, t.table_code, t.capacity,
      r.id as reservation_id, r.party_size, r.status as reservation_status,
      r.dietary_preference, r.special_requests,
      c.name as customer_name, c.phone as customer_phone,
      o.id as order_id, o.total_amount, o.status as order_status
    FROM restaurant_tables t
    LEFT JOIN reservations r ON t.id = r.table_id 
      AND r.booking_date = $1 
      AND r.booking_time = $2
      AND r.status IN ('confirmed', 'occupied', 'completed')
    LEFT JOIN customers c ON r.customer_id = c.id
    LEFT JOIN orders o ON r.id = o.reservation_id AND o.status = 'active'
    ORDER BY t.table_code ASC
  `;

  const result = await query(sql, [date, time]);
  
  return {
    status: 200,
    body: { tables: result.rows }
  };
}

module.exports = {
  checkAvailability,
  createReservation,
  getPOSReservations,
  getTableStatus
};
