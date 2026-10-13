// Quick test to see which DB is being used
const db = require('./backend/db');

async function test() {
  try {
    const result = await db.query('SELECT 1 as test');
    console.log('✅ Database connected successfully');
    console.log('Result:', result.rows);
    
    // Check if it's PostgreSQL or SQLite
    if (db.pool) {
      console.log('🐘 Using PostgreSQL');
      console.log('Database:', db.pool.options.database);
      console.log('Host:', db.pool.options.host);
      console.log('Port:', db.pool.options.port);
    } else if (db.db) {
      console.log('📦 Using SQLite');
      console.log('Database file:', db.db.name);
    }
    
    // Check tables
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n📋 Tables in database:', tables.rows.map(r => r.table_name));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();
