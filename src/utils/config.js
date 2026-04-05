// ============================================================
// utils/config.js — App Configuration
// ============================================================

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "finance-dashboard-dev-secret-change-in-prod",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  NODE_ENV: process.env.NODE_ENV || "development",
};
