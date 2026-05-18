import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { sendMessageSchema } from "../validators/messageValidators.js";
import { send, inbox, sent, markRead, conversations, thread } from "../controllers/messageController.js";

const router = Router();

// In-memory typing state: Map<typingUserId, { toUserId, expiresAt }>
const typingState = new Map();
const TYPING_TTL_MS = 4000;

// POST /api/messages/typing  – signal that current user is typing to someone
router.post("/typing", requireAuth, (req, res) => {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ error: { message: "toUserId required" } });
    typingState.set(req.user.userId, { toUserId: Number(toUserId), expiresAt: Date.now() + TYPING_TTL_MS });
    return res.json({ ok: true });
});

// GET /api/messages/typing/:userId  – check if a specific user is typing to me
router.get("/typing/:userId", requireAuth, (req, res) => {
    const fromUserId = Number(req.params.userId);
    const entry = typingState.get(fromUserId);
    if (!entry || entry.expiresAt < Date.now() || entry.toUserId !== req.user.userId) {
        return res.json({ typing: false });
    }
    return res.json({ typing: true });
});

// POST /api/messages  – send a message
router.post("/", requireAuth, validate(sendMessageSchema), send);

// GET /api/messages  – inbox (received messages)
router.get("/", requireAuth, inbox);

// GET /api/messages/conversations  – grouped conversations
router.get("/conversations", requireAuth, conversations);

// GET /api/messages/sent  – sent messages
router.get("/sent", requireAuth, sent);

// GET /api/messages/thread/:userId  – full thread with a user
router.get("/thread/:userId", requireAuth, thread);

// PUT /api/messages/:id/read  – mark a message as read
router.put("/:id/read", requireAuth, markRead);

export default router;
