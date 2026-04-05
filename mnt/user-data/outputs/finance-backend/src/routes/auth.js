// ============================================================
// routes/auth.js — Authentication Endpoints
// ============================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { users, revokedTokens } = require("../store");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../utils/config");
const { loginValidators } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const { ok, sanitizeUser } = require("../utils/response");

const router = express.Router();

/**
 * POST /auth/login
 * Returns a JWT on valid credentials.
 */
router.post("/login", loginValidators, (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: "Account is inactive." });
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return ok(res, { token, user: sanitizeUser(user) });
});

/**
 * POST /auth/logout
 * Revokes the current token (adds to blocklist).
 */
router.post("/logout", authenticate, (req, res) => {
  revokedTokens.add(req.token);
  return ok(res, { message: "Logged out successfully." });
});

/**
 * GET /auth/me
 * Returns the currently authenticated user's profile.
 */
router.get("/me", authenticate, (req, res) => {
  return ok(res, sanitizeUser(req.user));
});

module.exports = router;
