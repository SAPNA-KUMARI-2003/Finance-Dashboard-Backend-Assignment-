// ============================================================
// index.js — Application Entry Point
// ============================================================

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { PORT, NODE_ENV } = require("./utils/config");

// ── Route imports ────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const recordRoutes = require("./routes/records");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// ── Global Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use(limiter);

// ── Routes ───────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/records", recordRoutes);
app.use("/dashboard", dashboardRoutes);

// ── Root Welcome Route ──────────────────────────────────────
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Finance Dashboard API</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #e9f9f2;
      --surface: #ffffff;
      --surface-strong: #d7f2e6;
      --text: #0b2e24;
      --muted: #2f5243;
      --accent: #0078d7;
      --accent-soft: #c7ebff;
      --border: rgba(0, 120, 215, 0.18);
      --shadow: 0 20px 50px rgba(15, 52, 66, 0.12);
    }
    [data-theme="dark"] {
      --bg: #071b1a;
      --surface: #0f2c31;
      --surface-strong: #143a3f;
      --text: #e9f9f2;
      --muted: #a2c8c0;
      --accent: #57c7ff;
      --accent-soft: #0e3e51;
      --border: rgba(87, 199, 255, 0.22);
      --shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top left, #b6f6d0 0%, rgba(0, 120, 215, 0.08) 30%), var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .page {
      width: min(100%, 900px);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 28px;
      box-shadow: var(--shadow);
      padding: 32px;
    }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    h1 { margin: 0; font-size: clamp(2rem, 2.5vw, 2.6rem); }
    .badge {
      background: var(--accent-soft);
      color: var(--accent);
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid var(--border);
      font-weight: 600;
    }
    p.lead { margin: 20px 0 24px; line-height: 1.75; max-width: 42rem; }
    ul { padding-left: 20px; margin: 0; display: grid; gap: 10px; }
    li { list-style: none; }
    code {
      display: inline-block;
      background: rgba(0, 120, 215, 0.1);
      color: var(--accent);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 0.95rem;
    }
    .panel { margin-top: 24px; padding: 24px; background: var(--surface-strong); border-radius: 22px; border: 1px solid var(--border); }
    .toggle { display: inline-flex; align-items: center; gap: 12px; cursor: pointer; color: var(--muted); }
    .toggle input { width: 1.1rem; height: 1.1rem; accent-color: var(--accent); }
    footer { margin-top: 28px; color: var(--muted); font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="page" id="page">
    <header>
      <div>
        <h1>Finance Dashboard API</h1>
        <div class="badge">Green + Blue Theme</div>
      </div>
      <label class="toggle">
        <span>Dark mode</span>
        <input type="checkbox" id="themeToggle" />
      </label>
    </header>

    <p class="lead">The backend API is running correctly. Use the links below to access authentication, user management, records, and dashboard analytics.</p>

    <div class="panel">
      <strong>Available routes</strong>
      <ul>
        <li><code>GET /</code> — browser-friendly status page</li>
        <li><code>POST /auth/login</code> — get JWT token</li>
        <li><code>POST /auth/logout</code> — revoke current token</li>
        <li><code>GET /auth/me</code> — fetch authenticated profile</li>
        <li><code>GET /users</code> — list users (admin only)</li>
        <li><code>GET /records</code> — list records with filters</li>
        <li><code>GET /dashboard</code> — dashboard summary</li>
        <li><code>GET /dashboard/summary</code> — detailed summary data</li>
        <li><code>GET /health</code> — health check</li>
      </ul>
    </div>

    <footer>Note: this is a backend API with a lightweight welcome UI on the root route. Use JSON endpoints for data operations.</footer>
  </div>

  <script>
    const toggle = document.getElementById('themeToggle');
    const page = document.documentElement;
    const saved = localStorage.getItem('theme');

    const setTheme = (mode) => {
      page.dataset.theme = mode;
      localStorage.setItem('theme', mode);
      toggle.checked = mode === 'dark';
    };

    if (saved) setTheme(saved);
    toggle.addEventListener('change', () => setTheme(toggle.checked ? 'dark' : 'light'));
  </script>
</body>
</html>`);
  }

  res.json({
    success: true,
    message: "Finance Dashboard API is running.",
    routes: ["/auth/login", "/auth/logout", "/auth/me", "/users", "/records", "/dashboard", "/health"],
  });
});

// ── Health Check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", env: NODE_ENV, timestamp: new Date().toISOString() });
});

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────
// Catches any unhandled errors thrown in route handlers
app.use((err, req, res, next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: "An unexpected internal error occurred." });
});

// ── Start ─────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Finance Dashboard API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${NODE_ENV}`);
    console.log(`\n📋 Seed credentials:`);
    console.log(`   Admin   → admin@finance.dev   / Admin@1234`);
    console.log(`   Analyst → analyst@finance.dev / Analyst@1234`);
    console.log(`   Viewer  → viewer@finance.dev  / Viewer@1234\n`);
  });
}

module.exports = app; // export for testing
