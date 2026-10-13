const { query } = require('../db');
const { sendJson, sendError } = require('../utils/response');

function parseId(pathname) {
  const m = pathname.match(/^\/api\/menu\/(\d+)$/);
  return m ? Number.parseInt(m[1], 10) : null;
}

async function handleMenu(req, res) {
  const { pathname } = req.parsedUrl;

  if (req.method === 'GET' && pathname === '/api/menu/categories') {
    const out = await query('SELECT id, name, display_order FROM categories ORDER BY display_order ASC, name ASC');
    return sendJson(res, 200, { categories: out.rows });
  }

  if (req.method === 'GET' && pathname === '/api/menu') {
    const isVegRaw = req.parsedUrl.searchParams.get('isVeg');
    const where = [];
    const params = [];

    if (isVegRaw === 'true' || isVegRaw === 'false') {
      params.push(isVegRaw === 'true');
      where.push(`mi.is_veg = $${params.length}`);
    }

    const sql = `
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.is_veg,
        mi.is_available,
        mi.image_url,
        c.id AS category_id,
        c.name AS category_name
      FROM menu_items mi
      JOIN categories c ON c.id = mi.category_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.display_order ASC, mi.name ASC, mi.id ASC
    `;

    const out = await query(sql, params);
    return sendJson(res, 200, { items: out.rows });
  }

  const id = parseId(pathname);
  if (req.method === 'GET' && id) {
    const out = await query(
      `
      SELECT
        mi.*,
        c.name AS category_name
      FROM menu_items mi
      JOIN categories c ON c.id = mi.category_id
      WHERE mi.id = $1
      `,
      [id]
    );
    if (!out.rows.length) return sendError(res, 404, 'Menu item not found');
    return sendJson(res, 200, { item: out.rows[0] });
  }

  sendError(res, 404, 'Not found');
}

module.exports = { handleMenu };

