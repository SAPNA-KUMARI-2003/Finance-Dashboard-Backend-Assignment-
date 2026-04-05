// ============================================================
// utils/response.js — Consistent API Response Helpers
// ============================================================

const ok = (res, data, meta = {}) =>
  res.status(200).json({ success: true, data, ...meta });

const created = (res, data) =>
  res.status(201).json({ success: true, data });

const noContent = (res) => res.status(204).send();

const notFound = (res, message = "Resource not found.") =>
  res.status(404).json({ success: false, error: message });

const conflict = (res, message) =>
  res.status(409).json({ success: false, error: message });

const forbidden = (res, message) =>
  res.status(403).json({ success: false, error: message });

/**
 * Strip sensitive fields before sending user objects to clients.
 */
const sanitizeUser = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

/**
 * Paginate an array.
 * Returns { data, pagination }
 */
const paginate = (array, page = 1, limit = 20) => {
  const p = parseInt(page, 10);
  const l = parseInt(limit, 10);
  const total = array.length;
  const totalPages = Math.ceil(total / l);
  const sliced = array.slice((p - 1) * l, p * l);
  return {
    data: sliced,
    pagination: { total, page: p, limit: l, totalPages },
  };
};

module.exports = { ok, created, noContent, notFound, conflict, forbidden, sanitizeUser, paginate };
