# FOMO API Documentation

Base URL: `http://localhost:5000/api`

All authenticated requests require:
```
Authorization: Bearer <token>
```

Errors always return: `{ "error": { "message": "...", "status": N } }`

---

## Auth

### POST `/auth/register`
Register a new account.

**Body**
```json
{ "email": "user@example.com", "password": "password123", "name": "Alex", "role": "DANCER" }
```
`role`: `DANCER` | `STUDIO` | `AGENCY`

**Response `201`**
```json
{
  "user": { "id": 1, "email": "user@example.com", "name": "Alex", "role": "DANCER", "createdAt": "..." },
  "token": "<jwt>"
}
```

**Status codes**
| Code | Reason |
|------|--------|
| 201 | Registered successfully |
| 400 | Validation error (invalid email, short password, missing role) |
| 409 | Email already in use |

---

### POST `/auth/login`
Login and get a JWT.

**Body**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response `200`**
```json
{ "user": { "id": 1, "email": "...", "role": "DANCER" }, "token": "<jwt>" }
```

**Status codes**
| Code | Reason |
|------|--------|
| 200 | OK |
| 401 | Invalid credentials |

---

## Events

### GET `/events`
List events with optional filters. Public.

**Query params** (all optional)

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search title / description / location |
| `city` | string | Filter by city |
| `from` | ISO date | Start date range |
| `to` | ISO date | End date range |
| `minPrice` | number | Min price in cents |
| `maxPrice` | number | Max price in cents |
| `page` | number | Page (default 1) |
| `limit` | number | Per page (default 10, max 50) |

**Response `200`**
```json
{ "items": [ { "id": 1, "title": "...", "location": "...", "priceCents": 1500, ... } ], "total": 42, "page": 1, "limit": 10 }
```

---

### GET `/events/popular`
Top 10 events ranked by ticket sales × recency. Public.

**Response `200`** — array of events with `ticketsSold` and `score` fields added.

---

### GET `/events/nearby`
Events within a radius. Public.

**Query params**

| Param | Required | Description |
|-------|----------|-------------|
| `lat` | ✓ | Latitude (-90 to 90) |
| `lng` | ✓ | Longitude (-180 to 180) |
| `radius` | – | Radius in km (default 10) |

**Response `200`** — array of events sorted by `distanceKm` ascending.

---

### GET `/events/:id`
Get a single event by ID. Public.

**Response `200`**
```json
{ "id": 3, "title": "Urban Salsa Night", "priceCents": 1500, "capacity": 80, "_count": { "tickets": 12 }, "creator": { "id": 2, "name": "Pulse Studio" } }
```

**Status codes** `200` | `404`

---

### POST `/events`
Create an event. **Auth: STUDIO or AGENCY.**

**Body**
```json
{
  "title": "Summer Workshop",
  "description": "Optional",
  "location": "Sofia, Bulgaria",
  "startAt": "2026-07-01T18:00:00Z",
  "endAt": "2026-07-01T21:00:00Z",
  "priceCents": 2000,
  "capacity": 50,
  "latitude": 42.6977,
  "longitude": 23.3219
}
```
`priceCents`, `title`, `location`, `startAt` are required. Others are optional.

**Response `201`** — the created event object.

**Status codes** `201` | `400` | `401` | `403`

---

### PUT `/events/:id`
Update an event. **Auth: STUDIO or AGENCY. Must be the creator.**

**Body** — any subset of the create fields.

**Response `200`** — updated event.

**Status codes** `200` | `400` | `401` | `403` | `404`

---

### DELETE `/events/:id`
Delete an event. **Auth: STUDIO or AGENCY. Must be the creator.**

**Response `204`** — no body.

**Status codes** `204` | `401` | `403` | `404`

---

## Tickets

### POST `/events/:id/tickets`
Purchase a ticket. **Auth: DANCER.**

No request body needed.

**Response `201`**
```json
{
  "ticket": { "id": 7, "priceCents": 1725, "userId": 1, "eventId": 3 },
  "transaction": { "grossCents": 1725, "commissionCents": 173, "netCents": 1552 },
  "loyalty": { "pointsEarned": 86, "totalPoints": 236, "loyaltyTransactionId": 5 },
  "pricing": { "basePriceCents": 1500, "finalPriceCents": 1725, "surgeApplied": true }
}
```

#### Business Rules

| Rule | Detail |
|------|--------|
| **Sold out** | Returns `409` if `ticketsSold >= capacity` |
| **Duplicate prevention** | Returns `409` if this user already has a ticket for this event |
| **Dynamic pricing (+15%)** | Triggered when `ticketsSold > capacity × 0.5` |
| **Commission** | 10% of the final price — taken at purchase, recorded per transaction |
| **Loyalty points** | 5% of the gross price — credited to the buyer's loyalty account |

**Status codes**
| Code | Reason |
|------|--------|
| 201 | Ticket purchased |
| 401 | Not authenticated |
| 403 | Role is not DANCER |
| 404 | Event not found |
| 409 | Sold out or duplicate ticket |

---

### GET `/events/me/tickets`
List all tickets owned by the authenticated dancer. **Auth: DANCER.**

**Response `200`** — array of tickets with nested event details.

---

## Users

### GET `/users/me`
Own full profile. **Auth required.**

**Response `200`**
```json
{
  "id": 1, "email": "dancer@fomo.dev", "name": "Alex", "role": "DANCER",
  "_count": { "followers": 3, "following": 5 },
  "loyaltyAccount": { "points": 350, "updatedAt": "..." }
}
```

---

### GET `/users/me/loyalty`
Loyalty points balance and last 20 transactions. **Auth required.**

**Response `200`**
```json
{
  "points": 350,
  "updatedAt": "...",
  "history": [
    { "id": 1, "points": 86, "reason": "Ticket purchase for event #3", "createdAt": "..." }
  ]
}
```

---

### GET `/users/:id`
Public profile of any user.

**Response `200`**
```json
{ "id": 2, "name": "Pulse Studio", "role": "STUDIO", "_count": { "followers": 12, "following": 2 } }
```

**Status codes** `200` | `400` | `404`

---

### GET `/users/:id/followers`
List users who follow `userId`. Public.

**Response `200`** — array of `{ id, name, role, followedAt }`.

---

### GET `/users/:id/following`
List users that `userId` is following. Public.

**Response `200`** — array of `{ id, name, role, followedAt }`.

---

### POST `/users/:id/follow`
Follow a user. **Auth required.**

**Response `201`**
```json
{ "followerId": 1, "followingId": 2, "followed": true }
```

**Status codes** `201` | `400` (self-follow) | `404` | `409` (already following)

---

### DELETE `/users/:id/follow`
Unfollow a user. **Auth required.**

**Response `200`**
```json
{ "followerId": 1, "followingId": 2, "followed": false }
```

**Status codes** `200` | `400` (not following)

---

## Messages

### POST `/messages`
Send a message. **Auth required.**

**Body**
```json
{ "receiverId": 2, "content": "Hey, are there spots left?" }
```

**Response `201`**
```json
{
  "id": 1, "content": "Hey, are there spots left?", "createdAt": "...", "readAt": null,
  "sender": { "id": 1, "name": "Alex" },
  "receiver": { "id": 2, "name": "Pulse Studio" }
}
```

**Status codes** `201` | `400` (self-message) | `404` (receiver not found)

---

### GET `/messages`
Inbox — received messages, newest first. **Auth required.**

**Response `200`** — array of messages with `sender` info.

---

### GET `/messages/sent`
Sent messages, newest first. **Auth required.**

**Response `200`** — array of messages with `receiver` info.

---

### PUT `/messages/:id/read`
Mark a received message as read. **Auth required. Only the receiver can do this.**

**Response `200`** — updated message with `readAt` timestamp set.

**Status codes** `200` | `403` (not the receiver) | `404`

---

## Health Check

### GET `/dance`
```json
{ "ok": true, "message": "Server is running" }
```
