import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCvEntrySchema, updateCvEntrySchema } from "../validators/cvValidators.js";
import * as cvController from "../controllers/cvController.js";

const router = Router();

// GET /api/cv/user/:userId - Public: List a dancer's CV entries
router.get("/user/:userId", cvController.listByUser);

// POST /api/cv/me - Protected (DANCER only): Add a CV entry
router.post(
  "/me",
  requireAuth,
  requireRole(["DANCER"]),
  validate(createCvEntrySchema),
  cvController.create
);

// PUT /api/cv/me/:entryId - Protected (DANCER only): Update a CV entry
router.put(
  "/me/:entryId",
  requireAuth,
  requireRole(["DANCER"]),
  validate(updateCvEntrySchema),
  cvController.update
);

// DELETE /api/cv/me/:entryId - Protected (DANCER only): Delete a CV entry
router.delete(
  "/me/:entryId",
  requireAuth,
  requireRole(["DANCER"]),
  cvController.remove
);

export default router;
