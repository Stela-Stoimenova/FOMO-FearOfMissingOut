# FOMO – Fear Of Missing Out

A web platform for the dance industry. Dancers, studios, and agencies can browse events, buy tickets, earn loyalty points, follow each other, and exchange messages.

---

## Stack

- **Node.js + Express** — REST API
- **PostgreSQL + Prisma ORM** — database & migrations
- **JWT** — authentication
- **Zod** — request validation
- **bcrypt** — password hashing

---

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally

### 2. Install dependencies

```bash
cd server
npm install
```

### 3. Configure environment

Copy `.env` and fill in your values:

```env
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/fomo?schema=public"
JWT_SECRET="your_secret_key"
PORT=5000
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Seed demo data *(optional)*

Creates 3 demo users and 10 events across Sofia, Plovdiv, and Varna.

```bash
npm run seed
```

Seeded accounts:

| Role | Email | Password |
|------|-------|----------|
| DANCER | dancer@fomo.dev | dancer123 |
| STUDIO | studio@fomo.dev | studio123 |
| AGENCY | agency@fomo.dev | agency123 |

### 6. Start the server

```bash
npm run dev        # development (nodemon, hot-reload)
npm start          # production
```

Server runs at **`http://localhost:5000`**

Health check: `GET http://localhost:5000/api/dance`

### 7. Run tests

Create a separate test database first, then:

```bash
# Fill in .env.test with your test DB URL, then:
npx prisma migrate deploy   # run once against fomo_test
npm test
```

All 12 tests should pass (auth, protected routes, full ticket purchase flow).

---

## Demo Flow with Postman

Import `server/docs/postman/FOMO_API.postman_collection.json` into Postman.

The collection uses these **variables** (set automatically by test scripts):

| Variable | Set by |
|----------|--------|
| `baseUrl` | Pre-set to `http://localhost:5000/api` |
| `studioToken` | Auto-captured from Register/Login Studio |
| `dancerToken` | Auto-captured from Register/Login Dancer |
| `eventId` | Auto-captured from Create Event |

### Recommended run order

1. **Register Studio** → auto-saves `studioToken`
2. **Login Studio** → refreshes `studioToken` (use if already registered)
3. **Create Event** → auto-saves `eventId`
4. **Register Dancer** → auto-saves `dancerToken`
5. **Login Dancer** → refreshes `dancerToken`
6. **Buy Ticket** → returns ticket + commission + loyalty info
7. **Buy Duplicate Ticket** → expect `409 Already have a ticket`
8. **My Tickets** → dancer's ticket list
9. **My Loyalty Balance** → points earned from purchase
10. **Popular Events** → ranked list
11. **Nearby Events (Sofia)** → events within 5 km of Sofia centre

---

## Architecture

```
server/
├── index.js                  # Entry point
├── prisma/
│   ├── schema.prisma         # Data models
│   ├── seed.js               # Demo data seeder
│   └── migrations/           # Migration history
├── src/
│   ├── app.js                # Express app, middleware, routes
│   ├── db.js                 # Prisma client singleton
│   ├── routes/               # auth.js, events.js, users.js, messages.js
│   ├── controllers/          # authController, eventController, userController, messageController
│   ├── services/             # authService, eventService, userService, messageService
│   ├── middleware/           # auth.js (JWT), validate.js (Zod), sanitize.js
│   └── validators/           # authValidators, eventValidators, messageValidators
├── tests/
│   └── api.test.js           # 12 integration tests
└── docs/
    └── postman/              # Postman collection
```

---

## Business Rules

| Rule | Detail |
|------|--------|
| **Dynamic pricing** | Ticket price increases **+15%** when more than 50% of capacity is sold |
| **Commission** | Platform takes **10%** of every ticket purchase (recorded per transaction) |
| **Loyalty points** | Dancer earns **5%** of the ticket gross price in loyalty points |
| **Duplicate prevention** | A dancer cannot buy a second ticket for the same event (`409`) |
| **Sold out** | Purchase blocked when `ticketsSold >= capacity` (`409`) |
| **Ownership** | Only the event creator can edit or delete their event |
| **Role guards** | Event creation: STUDIO / AGENCY only. Ticket purchase: DANCER only |

---

## API Overview

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Events | `GET /events`, `/popular`, `/nearby`, `GET/PUT/DELETE /events/:id`, `POST /events` |
| Tickets | `POST /events/:id/tickets`, `GET /events/me/tickets` |
| Users | `GET /users/me`, `/me/loyalty`, `/:id`, `/:id/followers`, `/:id/following`, `POST/DELETE /:id/follow` |
| Messages | `POST /messages`, `GET /messages`, `/messages/sent`, `PUT /messages/:id/read` |

Full reference: see `docs/api.md` or the Postman collection.
