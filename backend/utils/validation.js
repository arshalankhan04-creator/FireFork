function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHmTime(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

function toInt(value) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : NaN;
}

function requireString(value, field, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  const v = value.trim();
  if (v.length < min) throw new Error(`${field} is required`);
  if (v.length > max) throw new Error(`${field} is too long`);
  return v;
}

function requirePhone(value) {
  const v = requireString(value, 'mobileNumber', { min: 5, max: 30 });
  if (!/^[+()\-\s0-9]+$/.test(v)) throw new Error('mobileNumber contains invalid characters');
  return v;
}

function requirePartySize(value) {
  const n = toInt(value);
  if (!Number.isFinite(n) || n < 1 || n > 16) throw new Error('partySize must be between 1 and 16');
  return n;
}

function requireDate(value, field = 'bookingDate') {
  if (!isIsoDate(value)) throw new Error(`${field} must be YYYY-MM-DD`);
  return value;
}

function requireTime(value, field = 'bookingTime') {
  if (!isHmTime(value)) throw new Error(`${field} must be HH:MM`);
  return value;
}

module.exports = {
  isIsoDate,
  isHmTime,
  requireString,
  requirePhone,
  requirePartySize,
  requireDate,
  requireTime
};

