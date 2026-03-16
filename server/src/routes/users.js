import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
    getMe,
    updateMe,
    getProfile,
    loyaltyBalance,
    follow,
    unfollow,
    followers,
    following,
    search,
    createPortfolioItem,
    removePortfolioItem,
    tagEvent,
} from "../controllers/userController.js";

const router = Router();

// GET /api/users/search  – discover users
router.get("/search", search);

// GET /api/users/me  – own profile (auth required)
router.get("/me", requireAuth, getMe);

// PUT /api/users/me  – update own profile (auth required)
router.put("/me", requireAuth, updateMe);

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

// --- Portfolio & Tags (Self) ---

// POST /api/users/me/portfolio
router.post("/me/portfolio", requireAuth, createPortfolioItem);

// DELETE /api/users/me/portfolio/:itemId
router.delete("/me/portfolio/:itemId", requireAuth, removePortfolioItem);

// POST /api/users/me/tags/:eventId
router.post("/me/tags/:eventId", requireAuth, tagEvent);

export default router;
