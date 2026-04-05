// ============================================================
// routes/users.js — User Management (Admin only)
// ============================================================

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { users } = require("../store");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createUserValidators,
  updateUserValidators,
} = require("../middleware/validate");
const { ok, created, notFound, conflict, sanitizeUser } = require("../utils/response");

const router = express.Router();

// All user routes require auth
router.use(authenticate);

/**
 * GET /users
 * Admin only — list all users.
 */
router.get("/", authorize("user:read"), (req, res) => {
  return ok(res, users.map(sanitizeUser));
});

/**
 * GET /users/:id
 * Admin only — get a single user by ID.
 */
router.get("/:id", authorize("user:read"), (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return notFound(res, "User not found.");
  return ok(res, sanitizeUser(user));
});

/**
 * POST /users
 * Admin only — create a new user.
 */
router.post("/", authorize("user:create"), createUserValidators, (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return conflict(res, "A user with this email already exists.");

  const newUser = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  return created(res, sanitizeUser(newUser));
});

/**
 * PATCH /users/:id
 * Admin only — update user name, role, or status.
 * An admin cannot deactivate themselves.
 */
router.patch("/:id", authorize("user:update"), updateUserValidators, (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return notFound(res, "User not found.");

  // Prevent admin from deactivating their own account
  if (req.params.id === req.user.id && req.body.isActive === false) {
    return res.status(400).json({ error: "You cannot deactivate your own account." });
  }

  const { name, role, isActive } = req.body;
  if (name !== undefined) users[idx].name = name.trim();
  if (role !== undefined) users[idx].role = role;
  if (isActive !== undefined) users[idx].isActive = isActive;

  return ok(res, sanitizeUser(users[idx]));
});

/**
 * DELETE /users/:id
 * Admin only — soft delete (deactivate) a user.
 * Cannot delete your own account.
 */
router.delete("/:id", authorize("user:delete"), (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return notFound(res, "User not found.");

  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  // Soft delete: deactivate instead of removing
  users[idx].isActive = false;
  return ok(res, { message: "User deactivated successfully.", user: sanitizeUser(users[idx]) });
});

module.exports = router;
