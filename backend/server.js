const http = require('http');
const { URL } = require('url');

const { config } = require('./config');
const { query } = require('./db');
const { sendJson, sendError } = require('./utils/response');

const { handleMenu } = require('./routes/menu');
const { 
  checkAvailability, 
  createReservation, 
  getPOSReservations, 
  getTableStatus 
} = require('./routes/reservations');
const { 
  createOrUpdateOrder, 
  finalizeOrder, 
  getBillDetails 
} = require('./routes/orders');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve(null);
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowList = new Set(
    [config.cors.frontendUrl, ...config.cors.allowedOrigins].filter(Boolean)
  );

  if (origin && allowList.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    // same-origin or non-browser client
  } else {
    // allow local dev by default for common ports
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
}

function notFound(res) {
  sendError(res, 404, 'Not found');
}

async function route(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Health
  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'FireFork API'
    });
    return;
  }

  // Attach helpers
  req.parsedUrl = url;
  req.readJsonBody = () => readJsonBody(req);

  // Routes
  if (pathname.startsWith('/api/menu')) return handleMenu(req, res);

  // Availability check
  if (req.method === 'GET' && pathname === '/api/availability/check') {
    const result = await checkAvailability(req, res);
    return sendJson(res, result.status, result.body);
  }

  // Create reservation
  if (req.method === 'POST' && pathname === '/api/reservations') {
    const body = await readJsonBody(req);
    const result = await createReservation(req, res, body);
    return sendJson(res, result.status, result.body);
  }

  // POS: Get reservations
  if (req.method === 'GET' && pathname === '/api/pos/reservations') {
    const result = await getPOSReservations(req, res);
    return sendJson(res, result.status, result.body);
  }

  // POS: Get table status
  if (req.method === 'GET' && pathname === '/api/pos/tables') {
    const result = await getTableStatus(req, res);
    return sendJson(res, result.status, result.body);
  }

  // POS: Create/update order
  if (req.method === 'POST' && pathname === '/api/pos/orders') {
    const body = await readJsonBody(req);
    const result = await createOrUpdateOrder(req, res, body);
    return sendJson(res, result.status, result.body);
  }

  // POS: Finalize order
  if (req.method === 'POST' && pathname.match(/^\/api\/pos\/orders\/(\d+)\/finalize$/)) {
    const orderId = pathname.match(/^\/api\/pos\/orders\/(\d+)\/finalize$/)[1];
    const result = await finalizeOrder(req, res, orderId);
    return sendJson(res, result.status, result.body);
  }

  // POS: Get bill details
  if (req.method === 'GET' && pathname.match(/^\/api\/pos\/bill\/(\d+)$/)) {
    const orderId = pathname.match(/^\/api\/pos\/bill\/(\d+)$/)[1];
    const result = await getBillDetails(req, res, orderId);
    return sendJson(res, result.status, result.body);
  }

  notFound(res);
}

async function main() {
  // Try DB connectivity (will use SQLite if PostgreSQL fails)
  try {
    await query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('💡 Attempting to use SQLite fallback...');
    // Don't exit - SQLite fallback should work
  }

  const server = http.createServer((req, res) => {
    route(req, res).catch((err) => {
      const msg = err && err.message ? err.message : 'Internal error';
      sendError(res, msg === 'Invalid JSON' ? 400 : 500, msg);
    });
  });

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🔥 FireFork API running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});

