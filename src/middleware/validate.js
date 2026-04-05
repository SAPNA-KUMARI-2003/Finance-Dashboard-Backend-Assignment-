// ============================================================
// middleware/validate.js — Input Validation
// ============================================================

const { validationResult, body, query, param } = require("express-validator");

/**
 * handleValidation — runs after validation chains; returns 422 if errors exist
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: "Validation failed.",
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ──────────────────────────────────────────
const loginValidators = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidation,
];

// ── User validators ──────────────────────────────────────────
const createUserValidators = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter.")
    .matches(/[0-9]/).withMessage("Password must contain a number."),
  body("role")
    .isIn(["admin", "analyst", "viewer"])
    .withMessage("Role must be one of: admin, analyst, viewer."),
  handleValidation,
];

const updateUserValidators = [
  param("id").isUUID().withMessage("Invalid user ID format."),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty."),
  body("role").optional().isIn(["admin", "analyst", "viewer"]).withMessage("Invalid role."),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean."),
  handleValidation,
];

// ── Record validators ────────────────────────────────────────
const createRecordValidators = [
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number."),
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Type must be 'income' or 'expense'."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("date").isISO8601().withMessage("Date must be a valid ISO 8601 date (YYYY-MM-DD)."),
  body("notes").optional().isString(),
  handleValidation,
];

const updateRecordValidators = [
  param("id").isUUID().withMessage("Invalid record ID format."),
  body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be positive."),
  body("type").optional().isIn(["income", "expense"]).withMessage("Invalid type."),
  body("category").optional().trim().notEmpty(),
  body("date").optional().isISO8601().withMessage("Invalid date format."),
  body("notes").optional().isString(),
  handleValidation,
];

const recordQueryValidators = [
  query("type").optional().isIn(["income", "expense"]),
  query("category").optional().isString(),
  query("from").optional().isISO8601().withMessage("'from' must be a valid date."),
  query("to").optional().isISO8601().withMessage("'to' must be a valid date."),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1."),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1–100."),
  handleValidation,
];

module.exports = {
  loginValidators,
  createUserValidators,
  updateUserValidators,
  createRecordValidators,
  updateRecordValidators,
  recordQueryValidators,
};
