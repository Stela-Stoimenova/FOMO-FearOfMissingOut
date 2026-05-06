import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as agencyController from "../controllers/agencyController.js";

const router = Router();

// All agency routes are protected and require AGENCY role
const agencyOnly = [requireAuth, requireRole(["AGENCY"])];

// IMPORTANT: /me/* routes must be defined BEFORE /:id/* to avoid "me" being captured as :id

// --- Collaborations (from agency's perspective) ---
router.get("/me/collaborations", ...agencyOnly, agencyController.getCollaborations);
router.post("/me/collaborations", ...agencyOnly, agencyController.sendCollaborationInvite);

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

// PATCH /api/agency/me/cv-tags/:cvId/accept
router.patch("/me/cv-tags/:cvId/accept", ...agencyOnly, agencyController.acceptCvTag);

// DELETE /api/agency/me/cv-tags/:cvId
router.delete("/me/cv-tags/:cvId", ...agencyOnly, agencyController.declineCvTag);

// Public agency profile endpoints (no auth) — must come AFTER /me/* routes
router.get("/:id/roster", agencyController.getPublicRoster);
router.get("/:id/collaborations", agencyController.getPublicCollaborations);
router.get("/:id/cv-tags", agencyController.getPublicCvTags);

export default router;
