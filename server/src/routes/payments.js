import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createIntent } from "../controllers/paymentController.js";

const router = Router();

// POST /api/payments/intent  — DANCER creates a Stripe PaymentIntent before buying
router.post("/intent", requireAuth, requireRole(["DANCER"]), createIntent);

export default router;
