# FOMO-FearOfMissingOut
A web platform dedicated to the dance industry where users (dancers, studios, agencies) can create portfolios, post events or workshops, buy tickets, earn loyalty points, and see events on a map. The platform includes economic processes such as commissions per transaction, dynamic pricing depending on demand, and ranking of popular events.

# January Update:
I designed and implemented a REST backend with public browsing and role-based protected actions. Users can browse events without authentication, while high-impact operations (event creation, editing, deletion, and ticket purchasing) require authentication and role validation. The backend uses Node.js, Express, PostgreSQL with Prisma ORM, JWT authentication, and enforces ownership and business rules at database and API level.

# Architecture & stack

Node.js + Express backend
PostgreSQL database
Prisma ORM with migrations
JWT authentication
Role-based access control (DANCER / STUDIO / AGENCY)

# Public access (no login)

Browse events
Search & filter events
View event details

# Protected actions (login required)

Register & login users
Create events (Studio / Agency only)
Edit & delete events (ownership enforced)
Buy tickets (Dancer only)
Prevent duplicate ticket purchases (DB constraint)

# Business logic

Ticket price stored at purchase time
Ownership validation
Role validation
Clean HTTP status codes (201, 403, 404, 409)
