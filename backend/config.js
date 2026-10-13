require('dotenv').config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function toInt(value, name) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) throw new Error(`Invalid integer for ${name}`);
  return n;
}

function toNumber(value, name) {
  const n = Number(String(value));
  if (!Number.isFinite(n)) throw new Error(`Invalid number for ${name}`);
  return n;
}

const config = {
  port: toInt(process.env.PORT ?? 3000, 'PORT'),
  db: {
    host: required('DB_HOST', 'localhost'),
    port: toInt(process.env.DB_PORT ?? 5432, 'DB_PORT'),
    database: required('DB_NAME', 'firefork_db'),
    user: required('DB_USER', 'postgres'),
    password: String(process.env.DB_PASSWORD ?? ''),
    max: toInt(process.env.DB_POOL_MAX ?? 10, 'DB_POOL_MAX')
  },
  cors: {
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://127.0.0.1:5500'
  },
  pos: {
    defaultPin: process.env.DEFAULT_POS_PIN ?? '1234'
  },
  billing: {
    taxRate: toNumber(process.env.TAX_RATE ?? 0.05, 'TAX_RATE')
  },
  restaurant: {
    openTime: process.env.RESTAURANT_OPEN_TIME ?? '14:00',
    closeTime: process.env.RESTAURANT_CLOSE_TIME ?? '22:00',
    reservationDurationMinutes: toInt(process.env.RESERVATION_DURATION_MINUTES ?? 120, 'RESERVATION_DURATION_MINUTES')
  }
};

module.exports = { config };

