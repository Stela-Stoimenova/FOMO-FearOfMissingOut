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

---

## Frontend Demo (Thesis Walkthrough)

### Prerequisites

Both servers must be running simultaneously in two separate terminals:

```bash
# Terminal 1 — Backend API
cd server
npm start
# → Runs at http://localhost:5000

# Terminal 2 — React frontend
cd client
npm run dev
# → Opens at http://localhost:5173
```

Make sure the database has seed data loaded first:

```bash
cd server
npm run seed
```

---

### Demo Accounts (from seed)

| Role   | Email              | Password   | What they can do |
|--------|--------------------|------------|------------------|
| DANCER | dancer@fomo.dev    | dancer123  | Browse events, buy tickets, earn/spend loyalty points, follow users |
| STUDIO | studio@fomo.dev    | studio123  | Create events, manage weekly classes, publish membership tiers |
| AGENCY | agency@fomo.dev    | agency123  | Manage talent roster, accept/decline studio collaborations |

---

### Full Ticket Purchase Flow (step-by-step)

**1. Browse Events**
- Open `http://localhost:5173`
- The homepage shows the upcoming event grid loaded from `GET /api/events`
- Click any event card to open the detail page

**2. Log in as Dancer**
- Click **Login** in the navbar
- Email: `dancer@fomo.dev` / Password: `dancer123`
- The navbar now shows your role badge and a link to **Dashboard**

**3. Buy a Ticket with Loyalty Points**
- Navigate to any event (e.g. the first card on the homepage)
- On the event detail page you will see:
  - The current price (possibly with a **+15% surge** badge if >50% sold)
  - A **Loyalty Discount Available** box showing your points balance
  - A **"Use Points"** checkbox (enabled by default)
- Leave the checkbox checked and click **Buy Ticket — €X.XX**
- After purchase you see a receipt showing:
  - Base price / Discount applied / Final paid
  - Platform commission (10%)
  - Points deducted + Points earned + New balance

**4. Check Your Tickets**
- Click **Dashboard** → **My Tickets** (or navigate to `/my-tickets`)
- Your ticket appears with status **Confirmed** and the exact price paid
- Click **Cancel** to test the 90% refund flow

**5. Explore the Wish List**
- On any event detail page, click the **❤** button to save the event
- Go to **Dashboard** — the event appears in your **Wish List** section
- Click it again to unsave (a toast confirms the action)

**6. Studio Profile & Memberships**
- Log out → Log in as `studio@fomo.dev`
- Go to **My Profile** → you'll see the **Studio Manager** with tabs:
  - **Schedule** — add/edit weekly classes
  - **Memberships** — create tiered plans (e.g. 10-class pass)
  - **Team** — link instructors by searching dancers
  - **Collaborations** — send a partnership request to the agency
- Navigate to **`/users/<studio-id>`** to see the public-facing studio profile

**7. Agency Collaboration Flow**
- Log out → Log in as `agency@fomo.dev`
- Go to **My Profile** → **Agency Manager**
  - **Collaborations** tab: the studio request appears as *Pending* → click **Accept**
  - **Talent Roster** tab: search for a dancer and add them to your managed roster
  - **CV Mentions** tab: any dancer who tagged this agency in their CV appears here

**8. Dancer CV**
- Log out → Log in as `dancer@fomo.dev`
- Go to **My Profile** → **CV Manager**
- Add a CV entry (e.g. a training or project) and optionally tag the studio/agency
- Navigate to your public profile (`/users/<dancer-id>`) to see the professional timeline

---

### Key Business Rules Demonstrated

| Scenario | Expected result |
|----------|----------------|
| Buy same ticket twice | `409` error toast: "You already have a ticket for this event" |
| Buy when sold out | Button shows **Sold Out** (disabled) |
| Buy when >50% sold | Price shows +15% surge badge, original price struck through |
| Cancel a ticket | Status → CANCELLED, 90% refund shown; commission transaction reversed |
| Use loyalty points | Discount deducted from price; points balance updates immediately |

