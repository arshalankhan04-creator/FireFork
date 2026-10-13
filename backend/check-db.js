const db = require('./db');

async function check() {
  try {
    // Check which DB
    if (db.pool) {
      console.log('✅ Using PostgreSQL');
      const result = await db.query('SELECT current_database(), version()');
      console.log('Database:', result.rows[0].current_database);
      console.log('Version:', result.rows[0].version.split('\n')[0]);
    } else {
      console.log('✅ Using SQLite');
    }
    
    // Check reservations
    const res = await db.query('SELECT COUNT(*) as count FROM reservations');
    console.log(`\n📊 Reservations in database: ${res.rows[0].count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

check();
