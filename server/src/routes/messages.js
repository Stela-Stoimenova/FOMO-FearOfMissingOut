import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendMessageSchema } from "../validators/messageValidators.js";
import { send, inbox, sent, markRead } from "../controllers/messageController.js";

const router = Router();

// POST /api/messages  – send a message
router.post("/", requireAuth, validate(sendMessageSchema), send);

// GET /api/messages  – inbox (received messages)
router.get("/", requireAuth, inbox);

// GET /api/messages/sent  – sent messages
router.get("/sent", requireAuth, sent);

// PUT /api/messages/:id/read  – mark a message as read
router.put("/:id/read", requireAuth, markRead);

export default router;
