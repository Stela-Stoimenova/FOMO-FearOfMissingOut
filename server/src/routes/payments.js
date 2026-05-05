import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createIntent, getOnboardingLink, checkConnectStatus, getWallet, removeCard, createSetupIntent } from "../controllers/paymentController.js";

const router = Router();

// POST /api/payments/intent  — DANCER creates a Stripe PaymentIntent before buying
router.post("/intent", requireAuth, requireRole(["DANCER"]), createIntent);

// GET /api/payments/onboarding — STUDIO/AGENCY get Connect onboarding link
router.get("/onboarding", requireAuth, requireRole(["STUDIO", "AGENCY"]), getOnboardingLink);

// GET /api/payments/status — Check if Connect onboarding is done
router.get("/status", requireAuth, requireRole(["STUDIO", "AGENCY"]), checkConnectStatus);

// GET /api/payments/wallet — List saved cards for DANCER
router.get("/wallet", requireAuth, requireRole(["DANCER"]), getWallet);

// POST /api/payments/setup-intent — Create a SetupIntent for saving a card
router.post("/setup-intent", requireAuth, requireRole(["DANCER"]), createSetupIntent);

// DELETE /api/payments/wallet/:cardId — Delete a saved card
router.delete("/wallet/:cardId", requireAuth, requireRole(["DANCER"]), removeCard);

export default router;
