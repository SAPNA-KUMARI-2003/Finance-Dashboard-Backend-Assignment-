// ============================================================
// middleware/auth.js — Authentication & Authorization
// ============================================================

const jwt = require("jsonwebtoken");
const { users, revokedTokens, PERMISSIONS } = require("../store");
const { JWT_SECRET } = require("../utils/config");

/**
 * authenticate — verifies JWT, attaches user to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  const token = authHeader.split(" ")[1];

  // Check if token was explicitly revoked (logout)
  if (revokedTokens.has(token)) {
    return res.status(401).json({ error: "Token has been revoked. Please log in again." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "Account is inactive. Contact an administrator." });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
};

/**
 * authorize(action) — middleware factory that checks role permissions
 * Usage: router.post("/records", authenticate, authorize("record:create"), handler)
 */
const authorize = (action) => (req, res, next) => {
  const allowed = PERMISSIONS[req.user.role] || [];
  if (!allowed.includes(action)) {
    return res.status(403).json({
      error: `Forbidden. Your role (${req.user.role}) does not have '${action}' permission.`,
    });
  }
  next();
};

module.exports = { authenticate, authorize };
