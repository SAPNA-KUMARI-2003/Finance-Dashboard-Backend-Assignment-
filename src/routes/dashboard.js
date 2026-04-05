// ============================================================
// routes/dashboard.js — Analytics & Summary Endpoints
// ============================================================

const express = require("express");
const { records } = require("../store");
const { authenticate, authorize } = require("../middleware/auth");
const { ok } = require("../utils/response");

const router = express.Router();

router.use(authenticate, authorize("dashboard:read"));

// ── Helpers ──────────────────────────────────────────────────

const activeRecords = () => records.filter((r) => !r.isDeleted);

const sumByType = (data, type) =>
  data.filter((r) => r.type === type).reduce((acc, r) => acc + r.amount, 0);

const groupBy = (data, keyFn) =>
  data.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + item.amount;
    return acc;
  }, {});

const getYearMonth = (dateStr) => dateStr.slice(0, 7); // "YYYY-MM"

/**
 * GET /dashboard
 * Returns the main dashboard summary view.
 * Available to: admin, analyst, viewer
 */
router.get("/", (req, res) => {
  const data = activeRecords();
  const totalIncome = sumByType(data, "income");
  const totalExpenses = sumByType(data, "expense");

  return ok(res, {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    recordCount: data.length,
  });
});

/**
 * GET /dashboard/summary
 * Returns top-level financial summary.
 * Available to: admin, analyst, viewer
 */
router.get("/summary", (req, res) => {
  const data = activeRecords();
  const totalIncome = sumByType(data, "income");
  const totalExpenses = sumByType(data, "expense");

  return ok(res, {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    recordCount: data.length,
  });
});

/**
 * GET /dashboard/category-totals
 * Returns breakdown of amounts by category (separated by type).
 */
router.get("/category-totals", (req, res) => {
  const data = activeRecords();
  const income = groupBy(data.filter((r) => r.type === "income"), (r) => r.category);
  const expenses = groupBy(data.filter((r) => r.type === "expense"), (r) => r.category);

  return ok(res, { income, expenses });
});

/**
 * GET /dashboard/monthly-trends
 * Returns income and expense totals per month, sorted chronologically.
 */
router.get("/monthly-trends", (req, res) => {
  const data = activeRecords();

  const trends = {};
  data.forEach((r) => {
    const month = getYearMonth(r.date);
    if (!trends[month]) trends[month] = { month, income: 0, expenses: 0 };
    if (r.type === "income") trends[month].income += r.amount;
    else trends[month].expenses += r.amount;
  });

  const sorted = Object.values(trends)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({ ...m, net: m.income - m.expenses }));

  return ok(res, sorted);
});

/**
 * GET /dashboard/recent-activity
 * Returns last N records (default 10), newest first.
 */
router.get("/recent-activity", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const recent = activeRecords()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);

  return ok(res, recent);
});

/**
 * GET /dashboard/weekly-trends
 * Returns income vs expense totals for the past 8 ISO weeks.
 */
router.get("/weekly-trends", (req, res) => {
  const data = activeRecords();

  // Get ISO week string: "YYYY-Www"
  const getWeek = (dateStr) => {
    const d = new Date(dateStr);
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const dayDiff = (d - jan4) / 86400000;
    const week = Math.ceil((dayDiff + jan4.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  };

  const trends = {};
  data.forEach((r) => {
    const week = getWeek(r.date);
    if (!trends[week]) trends[week] = { week, income: 0, expenses: 0 };
    if (r.type === "income") trends[week].income += r.amount;
    else trends[week].expenses += r.amount;
  });

  const sorted = Object.values(trends)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8)
    .map((w) => ({ ...w, net: w.income - w.expenses }));

  return ok(res, sorted);
});

module.exports = router;
