# Finance Dashboard Backend

A clean, role-based finance dashboard API built with **Node.js + Express**, using an **in-memory store** for simplicity. Designed for clarity, correctness, and maintainability.

This project also includes a lightweight browser-friendly root page at `/` with a green/blue themed UI and a light/dark mode toggle.

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Runtime | Node.js (v18+) | Widely adopted, fast I/O |
| Framework | Express 4 | Minimal, flexible, well-documented |
| Auth | JWT (jsonwebtoken) | Stateless, easy to integrate |
| Validation | express-validator | Declarative, chainable validators |
| Hashing | bcryptjs | Secure password storage |
| Persistence | In-memory array store | Simplicity for assessment scope |
| Testing | Jest + Supertest | Integration tests without mocking |
| Rate Limiting | express-rate-limit | Basic API abuse protection |

---

## Assumptions

1. **In-memory store** — All data lives in runtime arrays. Data resets on server restart. In production, this would be replaced with PostgreSQL (financial data) + Redis (token blocklist).
2. **Soft deletes** — Records and users are never hard-deleted; they are marked `isDeleted: true` or `isActive: false`. This preserves audit trails.
3. **Role model** — Three roles: `admin`, `analyst`, `viewer`. Permissions are checked via a static permissions matrix (not DB-stored), which is sufficient for this scope.
4. **JWT blocklist** — Logged-out tokens are added to an in-memory `Set`. In production, use Redis with TTL matching the token expiry.
5. **Analyst cannot create/modify records** — Only admins can mutate financial data. Analysts have read access to records and all dashboard endpoints.
6. **Viewer access** — Viewers can only access dashboard summary endpoints, not raw records.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the server (development)
npm run dev

# 3. Server runs at:
http://localhost:3000
```

---

## Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@finance.dev | Admin@1234 |
| Analyst | analyst@finance.dev | Analyst@1234 |
| Viewer | viewer@finance.dev | Viewer@1234 |

---

## Running Tests

```bash
npm test
```

Tests cover: authentication, role-based access control, record CRUD, filtering, pagination, dashboard analytics, dashboard summary access control, and edge cases (404s, 409s, 422s, 403s).

---

## API Reference

### Site Root

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/` | Browser-friendly API status page with green/blue theme and dark mode toggle | No |

### Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/auth/login` | Get JWT token | No |
| POST | `/auth/logout` | Revoke current token | Yes |
| GET | `/auth/me` | Get current user profile | Yes |

**Login request:**
```json
POST /auth/login
{ "email": "admin@finance.dev", "password": "Admin@1234" }
```

**Response:**
```json
{ "success": true, "data": { "token": "...", "user": { ... } } }
```

Use the token as: `Authorization: Bearer <token>`

---

### User Management (Admin only)

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| GET | `/users` | List all users | user:read |
| GET | `/users/:id` | Get user by ID | user:read |
| POST | `/users` | Create a user | user:create |
| PATCH | `/users/:id` | Update user name/role/status | user:update |
| DELETE | `/users/:id` | Soft-deactivate a user | user:delete |

**Create user body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secure@123",
  "role": "analyst"
}
```

---

### Financial Records (Admin: full CRUD; Analyst: read only)

| Method | Endpoint | Description | Permission |
|---|---|---|---|
| GET | `/records` | List records (paginated + filtered) | record:read |
| GET | `/records/:id` | Get single record | record:read |
| POST | `/records` | Create record | record:create |
| PATCH | `/records/:id` | Update record | record:update |
| DELETE | `/records/:id` | Soft delete record | record:delete |

**Filter query parameters:**
```
GET /records?type=expense&category=Rent&from=2024-11-01&to=2024-11-30&page=1&limit=10
```

**Create record body:**
```json
{
  "amount": 5000,
  "type": "income",
  "category": "Freelance",
  "date": "2024-12-01",
  "notes": "Project payment"
}
```

---

### Dashboard Analytics (All authenticated roles)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/summary` | Total income, expenses, net balance, record count |
| GET | `/dashboard/category-totals` | Income and expense amounts per category |
| GET | `/dashboard/monthly-trends` | Monthly income/expense/net — sorted chronologically |
| GET | `/dashboard/weekly-trends` | Last 8 weeks of income vs expense |
| GET | `/dashboard/recent-activity` | Latest N records (default 10, max 50) |

**Sample summary response:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 37500,
    "totalExpenses": 8050,
    "netBalance": 29450,
    "recordCount": 9
  }
}
```

---

## Role Permission Matrix

| Action | Admin | Analyst | Viewer |
|---|:---:|:---:|:---:|
| user:create | ✅ | ❌ | ❌ |
| user:read | ✅ | ❌ | ❌ |
| user:update | ✅ | ❌ | ❌ |
| user:delete | ✅ | ❌ | ❌ |
| record:create | ✅ | ❌ | ❌ |
| record:read | ✅ | ✅ | ❌ |
| record:update | ✅ | ❌ | ❌ |
| record:delete | ✅ | ❌ | ❌ |
| dashboard:read | ✅ | ✅ | ✅ |

---

## Error Response Format

All errors follow a consistent structure:

```json
{ "error": "Human-readable error message." }
```

Validation errors include field-level detail:
```json
{
  "error": "Validation failed.",
  "details": [
    { "field": "amount", "message": "Amount must be a positive number." }
  ]
}
```

### HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (business logic violation) |
| 401 | Unauthorized (missing/invalid/expired token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate email) |
| 422 | Unprocessable Entity (validation failure) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── index.js              # App entry, middleware setup, route mounting
│   ├── store.js              # In-memory data store + seed data + role definitions
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication + permission authorization
│   │   └── validate.js       # express-validator chains for all routes
│   ├── routes/
│   │   ├── auth.js           # /auth — login, logout, me
│   │   ├── users.js          # /users — CRUD (admin only)
│   │   ├── records.js        # /records — CRUD + filtering (role-gated)
│   │   └── dashboard.js      # /dashboard — analytics + summaries
│   └── utils/
│       ├── config.js         # Environment config (PORT, JWT_SECRET, etc.)
│       └── response.js       # Consistent response helpers + pagination
└── tests/
    └── api.test.js           # Full integration test suite (Jest + Supertest)
```

---

## Design Decisions & Tradeoffs

| Decision | Tradeoff |
|---|---|
| In-memory store | Fast setup; no data persistence across restarts |
| Static permissions matrix | Simple and readable; less flexible than DB-stored permissions |
| Soft deletes | Maintains audit trail; requires filtering `isDeleted` on every query |
| JWT with in-memory blocklist | Simple logout support; blocklist lost on restart |
| Flat role hierarchy | Easy to reason about; doesn't support fine-grained custom roles |

---

## What Would Change in Production

- Replace in-memory store with **PostgreSQL** (Prisma ORM)
- Use **Redis** for JWT blocklist with TTL
- Add **refresh tokens** for better session UX
- Add **audit logging** (who created/modified what and when)
- Switch to **environment-based secrets management** (Vault, AWS SSM)
- Add **OpenAPI/Swagger** documentation
- Add **Docker + docker-compose** for local dev
- Implement **database migrations** (e.g., Flyway or Prisma migrate)
