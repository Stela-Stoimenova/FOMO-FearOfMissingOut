import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createWeeklyClassSchema,
  updateWeeklyClassSchema,
  createMembershipTierSchema,
  updateMembershipTierSchema,
  createStudioTeamMemberSchema,
  createCollaborationSchema,
} from "../validators/studioValidators.js";
import * as studioController from "../controllers/studioController.js";

const router = Router();

// --- Weekly Classes ---
// Public: List studio classes
router.get("/:id/classes", studioController.listClasses);

// Protected (STUDIO only):
router.post(
  "/me/classes",
  requireAuth,
  requireRole(["STUDIO"]),
  validate(createWeeklyClassSchema),
  studioController.createClass
);
router.put(
  "/me/classes/:classId",
  requireAuth,
  requireRole(["STUDIO"]),
  validate(updateWeeklyClassSchema),
  studioController.updateClass
);
router.delete(
  "/me/classes/:classId",
  requireAuth,
  requireRole(["STUDIO"]),
  studioController.removeClass
);

// --- Memberships ---
// IMPORTANT: specific /me/* routes must be defined BEFORE /:id/* to avoid "me" being captured as :id

// Studio owner: all tiers including inactive (for management UI)
router.get(
  "/me/memberships-manage",
  requireAuth,
  requireRole(["STUDIO"]),
  studioController.listOwnMemberships
);

// Public: List active tiers
router.get("/:id/memberships", studioController.listMemberships);

// Protected (STUDIO only):
router.post(
  "/me/memberships",
  requireAuth,
  requireRole(["STUDIO"]),
  validate(createMembershipTierSchema),
  studioController.createMembership
);
router.put(
  "/me/memberships/:tierId",
  requireAuth,
  requireRole(["STUDIO"]),
  validate(updateMembershipTierSchema),
  studioController.updateMembership
);
router.delete(
  "/me/memberships/:tierId",
  requireAuth,
  requireRole(["STUDIO"]),
  studioController.removeMembership
);

// Protected (DANCER only): Purchase a membership
router.post(
  "/memberships/:tierId/purchase",
  requireAuth,
  requireRole(["DANCER"]),
  studioController.purchaseMembership
);

// Protected (DANCER only): Get own purchased memberships
router.get(
  "/me/memberships/purchased",
  requireAuth,
  requireRole(["DANCER"]),
  studioController.getMyMemberships
);

// --- Studio Team ---
// Public: List team
router.get("/:id/team", studioController.listTeam);

// Protected (STUDIO only):
router.post(
  "/me/team",
  requireAuth,
  requireRole(["STUDIO"]),
  validate(createStudioTeamMemberSchema),
  studioController.addTeamMember
);
router.delete(
  "/me/team/:teamId",
  requireAuth,
  requireRole(["STUDIO"]),
  studioController.removeTeamMember
);

// --- Collaborations ---
// Public: List collaborations
router.get("/:id/collaborations", studioController.listCollaborations);

// Protected (STUDIO only):
router.post(
  "/me/collaborations",
  requireAuth,
  requireRole(["STUDIO"]),
  validate(createCollaborationSchema),
  studioController.addCollaboration
);
router.delete(
  "/me/collaborations/:agencyId",
  requireAuth,
  requireRole(["STUDIO"]),
  studioController.removeCollaboration
);

export default router;
