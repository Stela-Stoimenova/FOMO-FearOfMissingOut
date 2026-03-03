import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  list,
  getById,
  create,
  update,
  remove,
  buyTicket,
  myTickets,
} from "../controllers/eventController.js";

const router = Router();

// GET /api/events (public)
router.get("/", list);

// GET /api/events/me/tickets (DANCER sees own tickets)
router.get("/me/tickets", requireAuth, requireRole(["DANCER"]), myTickets);

// GET /api/events/:id (public details)
router.get("/:id", getById);

// POST /api/events (STUDIO/AGENCY only)
router.post("/", requireAuth, requireRole(["STUDIO", "AGENCY"]), create);

// PUT /api/events/:id (creator only)
router.put("/:id", requireAuth, requireRole(["STUDIO", "AGENCY"]), update);

// DELETE /api/events/:id (creator only)
router.delete("/:id", requireAuth, requireRole(["STUDIO", "AGENCY"]), remove);

// POST /api/events/:id/tickets (DANCER buys ticket)
router.post("/:id/tickets", requireAuth, requireRole(["DANCER"]), buyTicket);

export default router;
