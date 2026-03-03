import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    getMe,
    getProfile,
    loyaltyBalance,
    follow,
    unfollow,
    followers,
    following,
} from "../controllers/userController.js";

const router = Router();

// GET /api/users/me  – own profile (auth required)
router.get("/me", requireAuth, getMe);

// GET /api/users/me/loyalty  – own loyalty balance (auth required)
router.get("/me/loyalty", requireAuth, loyaltyBalance);

// GET /api/users/:id  – public profile
router.get("/:id", getProfile);

// GET /api/users/:id/followers  – public
router.get("/:id/followers", followers);

// GET /api/users/:id/following  – public
router.get("/:id/following", following);

// POST /api/users/:id/follow  – follow a user (auth required)
router.post("/:id/follow", requireAuth, follow);

// DELETE /api/users/:id/follow  – unfollow a user (auth required)
router.delete("/:id/follow", requireAuth, unfollow);

export default router;
