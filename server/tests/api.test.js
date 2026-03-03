import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/db.js";

// Clean up test data between tests
afterAll(async () => {
    await prisma.loyaltyTransaction.deleteMany();
    await prisma.loyaltyAccount.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
});

// ─── AUTH TESTS ───────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
    it("registers a new user and returns token", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "dancer@test.com",
            password: "password123",
            role: "DANCER",
            name: "Test Dancer",
        });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user.email).toBe("dancer@test.com");
        expect(res.body.user).not.toHaveProperty("password");
    });

    it("rejects duplicate email with 409", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "dancer@test.com",
            password: "password123",
            role: "DANCER",
        });
        expect(res.status).toBe(409);
        expect(res.body.error.message).toMatch(/already used/i);
    });

    it("rejects invalid email with 400", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "not-an-email",
            password: "password123",
            role: "DANCER",
        });
        expect(res.status).toBe(400);
    });

    it("rejects missing role with 400", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "norole@test.com",
            password: "password123",
        });
        expect(res.status).toBe(400);
    });
});

describe("POST /api/auth/login", () => {
    it("logs in and returns token", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "dancer@test.com",
            password: "password123",
        });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
    });

    it("rejects wrong password with 401", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "dancer@test.com",
            password: "wrongpassword",
        });
        expect(res.status).toBe(401);
        expect(res.body.error.message).toMatch(/invalid credentials/i);
    });

    it("rejects unknown email with 401", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "nobody@test.com",
            password: "password123",
        });
        expect(res.status).toBe(401);
    });
});

// ─── PROTECTED ROUTE ACCESS ───────────────────────────────────────────────

describe("Protected route access", () => {
    it("rejects request without token with 401", async () => {
        const res = await request(app).get("/api/events/me/tickets");
        expect(res.status).toBe(401);
    });

    it("rejects request with invalid token with 401", async () => {
        const res = await request(app)
            .get("/api/events/me/tickets")
            .set("Authorization", "Bearer invalid.token.here");
        expect(res.status).toBe(401);
    });
});

// ─── EVENTS & TICKET TESTS ────────────────────────────────────────────────

describe("Ticket purchase flow", () => {
    let studioToken, dancerToken, eventId;

    beforeAll(async () => {
        // Register studio
        const studioRes = await request(app).post("/api/auth/register").send({
            email: "studio@test.com",
            password: "password123",
            role: "STUDIO",
            name: "Test Studio",
        });
        studioToken = studioRes.body.token;

        // Register dancer
        const dancerRes = await request(app).post("/api/auth/register").send({
            email: "dancer2@test.com",
            password: "password123",
            role: "DANCER",
            name: "Test Dancer 2",
        });
        dancerToken = dancerRes.body.token;

        // Create an event as studio
        const eventRes = await request(app)
            .post("/api/events")
            .set("Authorization", `Bearer ${studioToken}`)
            .send({
                title: "Test Event",
                location: "Test City",
                startAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
                priceCents: 1000,
            });
        eventId = eventRes.body.id;
    });

    it("dancer can buy a ticket and gets commission + loyalty info", async () => {
        const res = await request(app)
            .post(`/api/events/${eventId}/tickets`)
            .set("Authorization", `Bearer ${dancerToken}`);

        expect(res.status).toBe(201);

        // Ticket
        expect(res.body.ticket).toHaveProperty("id");
        expect(res.body.ticket.priceCents).toBe(1000);

        // Commission (10%)
        expect(res.body.transaction.grossCents).toBe(1000);
        expect(res.body.transaction.commissionCents).toBe(100);
        expect(res.body.transaction.netCents).toBe(900);

        // Loyalty (5%)
        expect(res.body.loyalty.pointsEarned).toBe(50);
        expect(res.body.loyalty.totalPoints).toBe(50);
    });

    it("prevents duplicate ticket purchase with 409", async () => {
        const res = await request(app)
            .post(`/api/events/${eventId}/tickets`)
            .set("Authorization", `Bearer ${dancerToken}`);

        expect(res.status).toBe(409);
        expect(res.body.error.message).toMatch(/already have a ticket/i);
    });

    it("studio cannot buy a ticket (403 forbidden)", async () => {
        const res = await request(app)
            .post(`/api/events/${eventId}/tickets`)
            .set("Authorization", `Bearer ${studioToken}`);

        expect(res.status).toBe(403);
    });
});
