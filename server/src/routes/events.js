import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/events  (public)
router.get("/", async (req, res) => {
  const { q, city, from, to, minPrice, maxPrice, page = "1", limit = "10" } = req.query;

  const where = {
    AND: [
      q
        ? {
            OR: [
              { title: { contains: String(q), mode: "insensitive" } },
              { description: { contains: String(q), mode: "insensitive" } },
              { location: { contains: String(q), mode: "insensitive" } },
            ],
          }
        : {},
      city ? { location: { contains: String(city), mode: "insensitive" } } : {},
      from ? { startAt: { gte: new Date(String(from)) } } : {},
      to ? { startAt: { lte: new Date(String(to)) } } : {},
      minPrice ? { priceCents: { gte: Number(minPrice) } } : {},
      maxPrice ? { priceCents: { lte: Number(maxPrice) } } : {},
    ],
  };

  const take = Math.min(Number(limit) || 10, 50);
  const skip = (Number(page) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startAt: "asc" },
      skip,
      take,
      include: { creator: { select: { id: true, name: true, role: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), limit: take });
});

// GET /api/events/my-tickets (DANCER sees own tickets)
router.get("/me/tickets", requireAuth, requireRole(["DANCER"]), async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "desc" },
    include: {
      event: { include: { creator: { select: { id: true, name: true, role: true } } } },
    },
  });

  res.json(tickets);
});


// GET /api/events/:id (public details)
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, role: true } },
      _count: { select: { tickets: true } },
    },
  });

  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json(event);
});

// POST /api/events (STUDIO/AGENCY only)
router.post("/", requireAuth, requireRole(["STUDIO", "AGENCY"]), async (req, res) => {
  try {
    const { title, description, location, startAt, endAt, priceCents } = req.body;

    if (!title || !location || !startAt || typeof priceCents !== "number") {
      return res.status(400).json({ message: "title, location, startAt, priceCents are required" });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description ?? null,
        location,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        priceCents,
        creatorId: req.user.userId,
      },
    });

    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: "Create event failed", error: String(err) });
  }
});

// PUT /api/events/:id (creator only)
router.put("/:id", requireAuth, requireRole(["STUDIO", "AGENCY"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Event not found" });

    if (existing.creatorId !== req.user.userId) {
      return res.status(403).json({ message: "You can only edit your own events" });
    }

    const { title, description, location, startAt, endAt, priceCents } = req.body;

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        location: location ?? existing.location,
        startAt: startAt ? new Date(startAt) : existing.startAt,
        endAt: endAt === null ? null : endAt ? new Date(endAt) : existing.endAt,
        priceCents: typeof priceCents === "number" ? priceCents : existing.priceCents,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update event failed", error: String(err) });
  }
});

// DELETE /api/events/:id (creator only)
router.delete("/:id", requireAuth, requireRole(["STUDIO", "AGENCY"]), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Event not found" });

    if (existing.creatorId !== req.user.userId) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }

    await prisma.event.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Delete event failed", error: String(err) });
  }
});

// POST /api/events/:id/tickets (DANCER buys ticket)
router.post("/:id/tickets", requireAuth, requireRole(["DANCER"]), async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId)) return res.status(400).json({ message: "Invalid event id" });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Create ticket. DB unique constraint prevents duplicate tickets per user/event.
    const ticket = await prisma.ticket.create({
      data: {
        userId: req.user.userId,
        eventId: eventId,
        priceCents: event.priceCents,
      },
    });

    res.status(201).json(ticket);
  } catch (err) {
    // Prisma unique constraint error (user already bought a ticket)
    if (String(err).includes("Unique constraint")) {
      return res.status(409).json({ message: "You already have a ticket for this event" });
    }
    res.status(500).json({ message: "Ticket purchase failed", error: String(err) });
  }
});




export default router;
