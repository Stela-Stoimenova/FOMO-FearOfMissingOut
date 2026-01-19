import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET /api/events  (public)
router.get("/", async (req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { startAt: "asc" },
    include: { creator: { select: { id: true, name: true, role: true } } },
  });
  res.json(events);
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

export default router;
