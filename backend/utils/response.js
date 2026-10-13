function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function sendError(res, statusCode, message, details) {
  const payload = { error: message };
  if (details) payload.details = details;
  sendJson(res, statusCode, payload);
}

module.exports = { sendJson, sendError };

