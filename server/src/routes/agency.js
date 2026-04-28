import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as agencyController from "../controllers/agencyController.js";

const router = Router();

// All agency routes are protected and require AGENCY role
const agencyOnly = [requireAuth, requireRole(["AGENCY"])];

// --- Collaborations (from agency's perspective) ---
// GET /api/agency/me/collaborations — list studios that sent collaboration requests
router.get("/me/collaborations", ...agencyOnly, agencyController.getCollaborations);

// PATCH /api/agency/me/collaborations/:studioId/accept — accept a pending request
router.patch("/me/collaborations/:studioId/accept", ...agencyOnly, agencyController.acceptCollaboration);

// DELETE /api/agency/me/collaborations/:studioId — decline or end a collaboration
router.delete("/me/collaborations/:studioId", ...agencyOnly, agencyController.declineCollaboration);

// --- Talent Roster ---
// GET /api/agency/me/roster — list managed dancers
router.get("/me/roster", ...agencyOnly, agencyController.getRoster);

// POST /api/agency/me/roster — add dancer to roster
router.post("/me/roster", ...agencyOnly, agencyController.addToRoster);

// DELETE /api/agency/me/roster/:dancerId — remove dancer from roster
router.delete("/me/roster/:dancerId", ...agencyOnly, agencyController.removeFromRoster);

// --- CV Tags ---
// GET /api/agency/me/cv-tags — CV entries where this agency was tagged
router.get("/me/cv-tags", ...agencyOnly, agencyController.getTaggedCvEntries);

export default router;
