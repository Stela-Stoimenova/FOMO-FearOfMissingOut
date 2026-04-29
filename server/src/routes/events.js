import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { createEventSchema, updateEventSchema, nearbyQuerySchema } from "../validators/eventValidators.js";
import {
  list,
  popular,
  nearby,
  getById,
  create,
  update,
  remove,
  buyTicket,
  myTickets,
  saveEvent,
  unsaveEvent,
  getSavedEvents,
  cancelTicket,
} from "../controllers/eventController.js";

const router = Router();

// GET /api/events (public)
router.get("/", list);

// GET /api/events/popular (public)
router.get("/popular", popular);

// GET /api/events/nearby?lat=&lng=&radius= (public)
router.get("/nearby", validateQuery(nearbyQuerySchema), nearby);

// GET /api/events/me/tickets (DANCER sees own tickets)
router.get("/me/tickets", requireAuth, requireRole(["DANCER"]), myTickets);

// GET /api/events/me/saved (DANCER sees saved events)
router.get("/me/saved", requireAuth, requireRole(["DANCER"]), getSavedEvents);


// GET /api/events/:id (public details)
router.get("/:id", getById);

// POST /api/events (STUDIO/AGENCY only)
router.post("/", requireAuth, requireRole(["STUDIO", "AGENCY"]), validate(createEventSchema), create);

// PUT /api/events/:id (creator only)
router.put("/:id", requireAuth, requireRole(["STUDIO", "AGENCY"]), validate(updateEventSchema), update);

// DELETE /api/events/:id (creator only)
router.delete("/:id", requireAuth, requireRole(["STUDIO", "AGENCY"]), remove);

// POST /api/events/:id/tickets (DANCER buys ticket)
router.post("/:id/tickets", requireAuth, requireRole(["DANCER"]), buyTicket);

// POST /api/events/:id/save (DANCER saves event)
router.post("/:id/save", requireAuth, requireRole(["DANCER"]), saveEvent);

// DELETE /api/events/:id/save (DANCER unsaves event)
router.delete("/:id/save", requireAuth, requireRole(["DANCER"]), unsaveEvent);

// POST /api/events/tickets/:id/cancel (DANCER cancels ticket)
router.post("/tickets/:id/cancel", requireAuth, requireRole(["DANCER"]), cancelTicket);


export default router;
