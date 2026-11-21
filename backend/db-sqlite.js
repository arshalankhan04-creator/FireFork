const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'firefork.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_code TEXT UNIQUE NOT NULL,
      capacity INTEGER NOT NULL CHECK(capacity > 0)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      table_id INTEGER NOT NULL,
      booking_date DATE NOT NULL,
      booking_time TIME NOT NULL,
      duration_minutes INTEGER DEFAULT 120,
      party_size INTEGER NOT NULL CHECK(party_size > 0),
      dietary_preference TEXT,
      special_requests TEXT,
      status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'occupied', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      price REAL NOT NULL CHECK(price >= 0),
      description TEXT,
      is_veg INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      image_url TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      table_id INTEGER NOT NULL,
      order_date DATETIME NOT NULL,
      total_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'finalized')),
      finalized_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );
  `);

  // Seed tables if empty
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM restaurant_tables').get();
  if (tableCount.count === 0) {
    const insertTable = db.prepare('INSERT INTO restaurant_tables (table_code, capacity) VALUES (?, ?)');
    const tables = [
      ['T01', 2], ['T02', 2], ['T03', 2], ['T04', 2], ['T05', 2],
      ['T06', 4], ['T07', 4], ['T08', 4], ['T09', 4],
      ['T10', 6], ['T11', 6],
      ['T12', 8]
    ];
    tables.forEach(([code, cap]) => insertTable.run(code, cap));
  }

  // Seed categories if empty
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCount.count === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, display_order) VALUES (?, ?)');
    [
      ['Starters', 1],
      ['Mains',    2],
      ['Sides',    3],
      ['Desserts', 4]
    ].forEach(([name, order]) => insertCat.run(name, order));
  }

  // Seed menu if empty
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
  if (menuCount.count === 0) {
    const getCat = db.prepare('SELECT id FROM categories WHERE name = ?');
    const insertMenu = db.prepare(
      'INSERT INTO menu_items (name, category_id, price, description, is_veg, image_url) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const menu = [
      // [name, category, price, description, is_veg, image]
      ['Bone Marrow Brulée',          'Starters', 12.99, 'Torched bone marrow with herb crust',  0, 'assets/images/food/Bone Marrow Brulée.png'],
      ['Charred Octopus',             'Starters', 15.99, 'Grilled octopus with lemon',            0, 'assets/images/food/Charred Octopus.png'],
      ['Cauliflower Wings',           'Starters',  9.99, 'Crispy cauliflower bites',              1, 'assets/images/food/Cauliflower Wings.png'],
      ['Dukkah-Crusted Lamb Rack',    'Mains',    32.99, 'Spiced lamb rack',                      0, 'assets/images/food/Dukkah-Crusted Lamb Rack.png'],
      ['Lamb Riblets',                'Mains',    24.99, 'Tender lamb riblets',                   0, 'assets/images/food/Lamb Riblets.png'],
      ['Cauliflower Steak (The OG)',  'Mains',    18.99, 'Signature cauliflower steak',           1, 'assets/images/food/Cauliflower Steak (The OG).png'],
      ['Cottage Cheese Ribs',         'Mains',    16.99, 'Grilled cottage cheese',                1, 'assets/images/food/Cottage Cheese Ribs.png'],
      ['Mac & Cheese',                'Sides',     8.99, 'Creamy mac and cheese',                 1, 'assets/images/food/Mac & Cheese.png'],
      ['Gunpowder Baby Potatoes',     'Sides',     7.99, 'Spicy roasted potatoes',                1, 'assets/images/food/Gunpowder Baby Potatoes.png'],
      ['Creamed Spinach with Nutmeg', 'Sides',     6.99, 'Rich creamed spinach',                  1, 'assets/images/food/Creamed Spinach with Nutmeg.png'],
      ['Dark Chocolate Fondant',      'Desserts', 10.99, 'Molten chocolate cake',                 1, 'assets/images/food/Dark Chocolate Fondant.png'],
      ['Saffron & Pistachio Cheesecake', 'Desserts', 11.99, 'Exotic cheesecake',                 1, 'assets/images/food/Saffron & Pistachio Cheesecake.png']
    ];
    menu.forEach(([name, cat, price, desc, isVeg, img]) => {
      const category = getCat.get(cat);
      if (category) insertMenu.run(name, category.id, price, desc, isVeg, img);
    });
  }
}

initSchema();

function query(text, params = []) {
  // Convert PostgreSQL-style queries to SQLite
  let sqliteQuery = text
    .replace(/\$(\d+)/g, '?')
    .replace(/::INTERVAL/gi, '')
    .replace(/\|\|/g, '||')
    .replace(/COALESCE/gi, 'COALESCE')
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");
  
  // Handle INSERT...RETURNING for SQLite
  const isInsertReturning = /INSERT\s+INTO.*RETURNING/i.test(sqliteQuery);
  
  if (sqliteQuery.trim().toUpperCase().startsWith('SELECT')) {
    const stmt = db.prepare(sqliteQuery);
    const rows = params.length ? stmt.all(...params) : stmt.all();
    return Promise.resolve({ rows });
  } else if (isInsertReturning) {
    // Remove RETURNING clause and execute, then get last insert id
    const cleanQuery = sqliteQuery.replace(/RETURNING\s+\w+/i, '');
    const stmt = db.prepare(cleanQuery);
    const result = params.length ? stmt.run(...params) : stmt.run();
    return Promise.resolve({ 
      rows: [{ id: result.lastInsertRowid }],
      rowCount: result.changes 
    });
  } else {
    const stmt = db.prepare(sqliteQuery);
    const result = params.length ? stmt.run(...params) : stmt.run();
    return Promise.resolve({ 
      rows: result.lastInsertRowid ? [{ id: result.lastInsertRowid }] : [],
      rowCount: result.changes 
    });
  }
}

async function withClient(fn) {
  const client = {
    query: (text, params) => query(text, params),
    release: () => {}
  };
  return await fn(client);
}

module.exports = { query, withClient, db };
