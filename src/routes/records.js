// ============================================================
// routes/records.js — Financial Records CRUD + Filtering
// ============================================================

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { records } = require("../store");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createRecordValidators,
  updateRecordValidators,
  recordQueryValidators,
} = require("../middleware/validate");
const { ok, created, notFound, paginate } = require("../utils/response");

const router = express.Router();

router.use(authenticate);

// ── Helper: apply filters ────────────────────────────────────
const applyFilters = (data, query) => {
  let result = data.filter((r) => !r.isDeleted); // exclude soft-deleted

  if (query.type) result = result.filter((r) => r.type === query.type);
  if (query.category) {
    const cat = query.category.toLowerCase();
    result = result.filter((r) => r.category.toLowerCase().includes(cat));
  }
  if (query.from) result = result.filter((r) => r.date >= query.from);
  if (query.to)   result = result.filter((r) => r.date <= query.to);

  // Sort newest first
  result.sort((a, b) => new Date(b.date) - new Date(a.date));

  return result;
};

/**
 * GET /records
 * Analyst & Admin — list records with optional filters + pagination.
 * Query params: type, category, from, to, page, limit
 */
router.get("/", authorize("record:read"), recordQueryValidators, (req, res) => {
  const filtered = applyFilters(records, req.query);
  const { data, pagination } = paginate(filtered, req.query.page, req.query.limit || 20);
  return ok(res, data, { pagination });
});

/**
 * GET /records/:id
 * Analyst & Admin — get a single record by ID.
 */
router.get("/:id", authorize("record:read"), (req, res) => {
  const record = records.find((r) => r.id === req.params.id && !r.isDeleted);
  if (!record) return notFound(res, "Record not found.");
  return ok(res, record);
});

/**
 * POST /records
 * Admin only — create a new financial record.
 */
router.post("/", authorize("record:create"), createRecordValidators, (req, res) => {
  const { amount, type, category, date, notes } = req.body;

  const newRecord = {
    id: uuidv4(),
    amount: parseFloat(amount),
    type,
    category: category.trim(),
    date,
    notes: notes ? notes.trim() : "",
    isDeleted: false,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };

  records.push(newRecord);
  return created(res, newRecord);
});

/**
 * PATCH /records/:id
 * Admin only — partially update a record.
 */
router.patch("/:id", authorize("record:update"), updateRecordValidators, (req, res) => {
  const idx = records.findIndex((r) => r.id === req.params.id && !r.isDeleted);
  if (idx === -1) return notFound(res, "Record not found.");

  const { amount, type, category, date, notes } = req.body;
  if (amount !== undefined)   records[idx].amount = parseFloat(amount);
  if (type !== undefined)     records[idx].type = type;
  if (category !== undefined) records[idx].category = category.trim();
  if (date !== undefined)     records[idx].date = date;
  if (notes !== undefined)    records[idx].notes = notes.trim();
  records[idx].updatedAt = new Date().toISOString();

  return ok(res, records[idx]);
});

/**
 * DELETE /records/:id
 * Admin only — soft delete a record.
 */
router.delete("/:id", authorize("record:delete"), (req, res) => {
  const idx = records.findIndex((r) => r.id === req.params.id && !r.isDeleted);
  if (idx === -1) return notFound(res, "Record not found.");

  records[idx].isDeleted = true;
  records[idx].deletedAt = new Date().toISOString();
  return ok(res, { message: "Record deleted successfully." });
});

module.exports = router;
