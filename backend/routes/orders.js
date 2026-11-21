const { query, withClient } = require('../db');
const { config } = require('../config');

/**
 * Create or update order for a reservation
 * POST /api/pos/orders
 * Body: { reservationId, items: [{ menuItemId, quantity }] }
 */
async function createOrUpdateOrder(req, res, body) {
  const { reservationId, items } = body;

  if (!reservationId || !items || !Array.isArray(items) || items.length === 0) {
    return { status: 400, body: { error: 'Invalid request: reservationId and items required' } };
  }

  return withClient(async (client) => {
    await client.query('BEGIN');

    try {
      // Get reservation details
      const resSql = `
        SELECT r.id, r.table_id, r.booking_date, r.status
        FROM reservations r
        WHERE r.id = $1 AND r.status IN ('confirmed', 'occupied')
      `;
      const resResult = await client.query(resSql, [reservationId]);
      
      if (resResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { status: 404, body: { error: 'Reservation not found or not active' } };
      }

      const reservation = resResult.rows[0];

      // Get or create order
      let orderSql = `
        SELECT id FROM orders 
        WHERE reservation_id = $1 AND status = 'active'
      `;
      let orderResult = await client.query(orderSql, [reservationId]);
      let orderId;

      if (orderResult.rows.length === 0) {
        // Create new order
        const createOrderSql = `
          INSERT INTO orders (reservation_id, table_id, order_date, status)
          VALUES ($1, $2, $3, 'active')
          RETURNING id
        `;
        orderResult = await client.query(createOrderSql, [
          reservationId,
          reservation.table_id,
          reservation.booking_date
        ]);
        orderId = orderResult.rows[0].id;
      } else {
        orderId = orderResult.rows[0].id;
      }

      // Clear existing order items (replace strategy)
      await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);

      // Insert new order items
      for (const item of items) {
        const { menuItemId, quantity } = item;
        
        if (!menuItemId || !quantity || quantity < 1) continue;

        // Get menu item price
        const menuSql = `SELECT price FROM menu_items WHERE id = $1 AND is_available = 1`;
        const menuResult = await client.query(menuSql, [menuItemId]);
        
        if (menuResult.rows.length === 0) continue;

        const unitPrice = parseFloat(menuResult.rows[0].price);
        const subtotal = unitPrice * quantity;

        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, menuItemId, quantity, unitPrice, subtotal]
        );
      }

      // Calculate totals
      const totalSql = `
        SELECT COALESCE(SUM(subtotal), 0) as total
        FROM order_items
        WHERE order_id = $1
      `;
      const totalResult = await client.query(totalSql, [orderId]);
      const totalAmount = parseFloat(totalResult.rows[0].total || 0);
      const taxAmount = totalAmount * config.billing.taxRate;
      const grandTotal = totalAmount + taxAmount;

      // Update order totals
      await client.query(
        `UPDATE orders 
         SET total_amount = $1, tax_amount = $2, grand_total = $3
         WHERE id = $4`,
        [totalAmount, taxAmount, grandTotal, orderId]
      );

      // Update reservation status to occupied if confirmed
      if (reservation.status === 'confirmed') {
        await client.query(
          `UPDATE reservations SET status = 'occupied' WHERE id = $1`,
          [reservationId]
        );
      }

      await client.query('COMMIT');

      return {
        status: 200,
        body: {
          success: true,
          orderId,
          totalAmount,
          taxAmount,
          grandTotal
        }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Order creation error:', err);
      return { status: 500, body: { error: 'Failed to create/update order' } };
    }
  });
}

/**
 * Finalize order and generate bill
 * POST /api/pos/orders/:id/finalize
 */
async function finalizeOrder(req, res, orderId) {
  return withClient(async (client) => {
    await client.query('BEGIN');

    try {
      // Update order status
      const updateSql = `
        UPDATE orders 
        SET status = 'finalized', finalized_at = NOW()
        WHERE id = $1 AND status = 'active'
        RETURNING reservation_id
      `;
      const result = await client.query(updateSql, [orderId]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return { status: 404, body: { error: 'Order not found or already finalized' } };
      }

      const reservationId = result.rows[0].reservation_id;

      // Update reservation status to completed
      await client.query(
        `UPDATE reservations SET status = 'completed' WHERE id = $1`,
        [reservationId]
      );

      await client.query('COMMIT');

      return {
        status: 200,
        body: { success: true, orderId, message: 'Bill generated successfully' }
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Order finalization error:', err);
      return { status: 500, body: { error: 'Failed to finalize order' } };
    }
  });
}

/**
 * Get bill details
 * GET /api/pos/bill/:orderId
 */
async function getBillDetails(req, res, orderId) {
  const sql = `
    SELECT 
      o.id as order_id, o.total_amount, o.tax_amount, o.grand_total,
      o.order_date, o.finalized_at,
      t.table_code,
      c.name as customer_name, c.phone as customer_phone
    FROM orders o
    JOIN reservations r ON o.reservation_id = r.id
    JOIN restaurant_tables t ON o.table_id = t.id
    JOIN customers c ON r.customer_id = c.id
    WHERE o.id = $1
  `;

  const result = await query(sql, [orderId]);

  if (result.rows.length === 0) {
    return { status: 404, body: { error: 'Bill not found' } };
  }

  // Get order items separately
  const itemsSql = `
    SELECT m.name, oi.quantity, oi.unit_price as unitPrice, oi.subtotal
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.order_id = $1
    ORDER BY oi.id
  `;
  const itemsResult = await query(itemsSql, [orderId]);

  const bill = result.rows[0];
  bill.items = itemsResult.rows;

  return {
    status: 200,
    body: { bill }
  };
}

module.exports = {
  createOrUpdateOrder,
  finalizeOrder,
  getBillDetails
};
