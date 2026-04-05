// ============================================================
// store.js — In-Memory Data Store
// Using an in-memory store for simplicity (assumption documented in README).
// In production, replace with a relational DB (PostgreSQL) or document DB (MongoDB).
// ============================================================

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

// ── Roles ────────────────────────────────────────────────────
const ROLES = {
  ADMIN: "admin",
  ANALYST: "analyst",
  VIEWER: "viewer",
};

// ── Permissions matrix ───────────────────────────────────────
// Each role maps to a set of allowed actions.
const PERMISSIONS = {
  [ROLES.ADMIN]: [
    "user:create", "user:read", "user:update", "user:delete",
    "record:create", "record:read", "record:update", "record:delete",
    "dashboard:read",
  ],
  [ROLES.ANALYST]: [
    "record:read", "dashboard:read",
  ],
  [ROLES.VIEWER]: [
    "dashboard:read",
  ],
};

// ── Seed data ─────────────────────────────────────────────────
const ADMIN_ID = uuidv4();
const ANALYST_ID = uuidv4();
const VIEWER_ID = uuidv4();

const users = [
  {
    id: ADMIN_ID,
    name: "Alice Admin",
    email: "admin@finance.dev",
    passwordHash: bcrypt.hashSync("Admin@1234", 10),
    role: ROLES.ADMIN,
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: ANALYST_ID,
    name: "Bob Analyst",
    email: "analyst@finance.dev",
    passwordHash: bcrypt.hashSync("Analyst@1234", 10),
    role: ROLES.ANALYST,
    isActive: true,
    createdAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: VIEWER_ID,
    name: "Carol Viewer",
    email: "viewer@finance.dev",
    passwordHash: bcrypt.hashSync("Viewer@1234", 10),
    role: ROLES.VIEWER,
    isActive: true,
    createdAt: new Date("2024-02-01").toISOString(),
  },
];

// Seed financial records
const records = [
  {
    id: uuidv4(), amount: 15000, type: "income", category: "Salary",
    date: "2024-11-01", notes: "November salary", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-11-01").toISOString(),
  },
  {
    id: uuidv4(), amount: 3200, type: "expense", category: "Rent",
    date: "2024-11-02", notes: "Monthly office rent", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-11-02").toISOString(),
  },
  {
    id: uuidv4(), amount: 800, type: "expense", category: "Utilities",
    date: "2024-11-05", notes: "Electricity and internet", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-11-05").toISOString(),
  },
  {
    id: uuidv4(), amount: 5000, type: "income", category: "Freelance",
    date: "2024-11-10", notes: "Consulting project", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-11-10").toISOString(),
  },
  {
    id: uuidv4(), amount: 450, type: "expense", category: "Subscriptions",
    date: "2024-11-12", notes: "SaaS tools", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-11-12").toISOString(),
  },
  {
    id: uuidv4(), amount: 15000, type: "income", category: "Salary",
    date: "2024-12-01", notes: "December salary", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-12-01").toISOString(),
  },
  {
    id: uuidv4(), amount: 3200, type: "expense", category: "Rent",
    date: "2024-12-02", notes: "Monthly office rent", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-12-02").toISOString(),
  },
  {
    id: uuidv4(), amount: 2500, type: "income", category: "Investment",
    date: "2024-12-15", notes: "Dividend income", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-12-15").toISOString(),
  },
  {
    id: uuidv4(), amount: 600, type: "expense", category: "Travel",
    date: "2024-12-20", notes: "Client meeting travel", isDeleted: false,
    createdBy: ADMIN_ID, createdAt: new Date("2024-12-20").toISOString(),
  },
];

// ── Revoked tokens store (simple JWT blocklist) ───────────────
const revokedTokens = new Set();

module.exports = { users, records, revokedTokens, ROLES, PERMISSIONS };
