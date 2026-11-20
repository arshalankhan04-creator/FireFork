const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { config } = require('../config');

function readSql(relPathFromBackend) {
  const p = path.resolve(__dirname, '..', relPathFromBackend);
  return fs.readFileSync(p, 'utf8');
}

async function ensureDatabaseExists() {
  const admin = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password || undefined,
    database: 'postgres'
  });

  await admin.connect();
  try {
    const exists = await admin.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [config.db.database]);
    if (!exists.rows.length) {
      await admin.query(`CREATE DATABASE ${config.db.database}`);
      // eslint-disable-next-line no-console
      console.log(`✅ Created database: ${config.db.database}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`ℹ Database already exists: ${config.db.database}`);
    }
  } finally {
    await admin.end();
  }
}

async function runSqlFiles() {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password || undefined,
    database: config.db.database
  });

  const files = [
    'database/schema.sql',
    'database/seed_menu.sql'
  ];

  await client.connect();
  try {
    for (const f of files) {
      const sql = readSql(f);
      await client.query(sql);
      // eslint-disable-next-line no-console
      console.log(`✅ Executed ${f}`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  await ensureDatabaseExists();
  await runSqlFiles();
  // eslint-disable-next-line no-console
  console.log('🔥 FireFork DB ready.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('DB init failed:', err);
  process.exit(1);
});

