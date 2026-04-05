// ============================================================
// tests/api.test.js — Integration Tests
// ============================================================

const request = require("supertest");
const app = require("../src/index");

// ── Shared state ─────────────────────────────────────────────
let adminToken, analystToken, viewerToken;
let createdRecordId, createdUserId;

// ── Login helper ─────────────────────────────────────────────
const login = async (email, password) => {
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.data?.token;
};

beforeAll(async () => {
  adminToken   = await login("admin@finance.dev",   "Admin@1234");
  analystToken = await login("analyst@finance.dev", "Analyst@1234");
  viewerToken  = await login("viewer@finance.dev",  "Viewer@1234");
});

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════
describe("Auth", () => {
  test("POST /auth/login — valid credentials returns token", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "admin@finance.dev", password: "Admin@1234",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  test("POST /auth/login — wrong password returns 401", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "admin@finance.dev", password: "wrong",
    });
    expect(res.status).toBe(401);
  });

  test("GET /auth/me — returns current user", async () => {
    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("admin");
  });

  test("GET /auth/me — without token returns 401", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════
describe("User Management (Admin)", () => {
  test("POST /users — admin can create a user", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test User", email: "test@finance.dev", password: "Test@1234", role: "viewer" });
    expect(res.status).toBe(201);
    createdUserId = res.body.data.id;
  });

  test("POST /users — duplicate email returns 409", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Dup", email: "test@finance.dev", password: "Test@1234", role: "viewer" });
    expect(res.status).toBe(409);
  });

  test("POST /users — analyst cannot create user (403)", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ name: "X", email: "x@x.com", password: "Test@1234", role: "viewer" });
    expect(res.status).toBe(403);
  });

  test("PATCH /users/:id — admin can update role", async () => {
    const res = await request(app)
      .patch(`/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "analyst" });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("analyst");
  });

  test("DELETE /users/:id — soft deletes user", async () => {
    const res = await request(app)
      .delete(`/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════
// RECORDS
// ═══════════════════════════════════════════════════════════
describe("Financial Records", () => {
  test("POST /records — admin can create a record", async () => {
    const res = await request(app)
      .post("/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 1000, type: "income", category: "Test", date: "2024-12-01" });
    expect(res.status).toBe(201);
    createdRecordId = res.body.data.id;
  });

  test("POST /records — analyst cannot create record (403)", async () => {
    const res = await request(app)
      .post("/records")
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ amount: 100, type: "expense", category: "X", date: "2024-12-01" });
    expect(res.status).toBe(403);
  });

  test("POST /records — invalid amount returns 422", async () => {
    const res = await request(app)
      .post("/records")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: -50, type: "income", category: "X", date: "2024-12-01" });
    expect(res.status).toBe(422);
  });

  test("GET /records — analyst can list records", async () => {
    const res = await request(app)
      .get("/records")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  test("GET /records — viewer cannot list records (403)", async () => {
    const res = await request(app)
      .get("/records")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  test("GET /records?type=income — filter by type works", async () => {
    const res = await request(app)
      .get("/records?type=income")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((r) => expect(r.type).toBe("income"));
  });

  test("PATCH /records/:id — admin can update", async () => {
    const res = await request(app)
      .patch(`/records/${createdRecordId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 2000 });
    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(2000);
  });

  test("DELETE /records/:id — soft delete works", async () => {
    const res = await request(app)
      .delete(`/records/${createdRecordId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test("GET /records/:id — deleted record returns 404", async () => {
    const res = await request(app)
      .get(`/records/${createdRecordId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
describe("Dashboard Analytics", () => {
  test("GET /dashboard/summary — viewer can access", async () => {
    const res = await request(app)
      .get("/dashboard/summary")
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBeGreaterThanOrEqual(0);
    expect(res.body.data.netBalance).toBeDefined();
  });

  test("GET /dashboard/category-totals — analyst can access", async () => {
    const res = await request(app)
      .get("/dashboard/category-totals")
      .set("Authorization", `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.income).toBeDefined();
  });

  test("GET /dashboard/monthly-trends — sorted chronologically", async () => {
    const res = await request(app)
      .get("/dashboard/monthly-trends")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const months = res.body.data.map((m) => m.month);
    const sorted = [...months].sort();
    expect(months).toEqual(sorted);
  });

  test("GET /dashboard/recent-activity — returns limited records", async () => {
    const res = await request(app)
      .get("/dashboard/recent-activity?limit=5")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });
});
