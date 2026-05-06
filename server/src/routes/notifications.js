import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as notificationsController from "../controllers/notificationsController.js";

const router = Router();

// All notification routes require auth
router.get("/", requireAuth, notificationsController.getNotifications);
router.get("/unread-count", requireAuth, notificationsController.getUnreadCount);
router.patch("/read-all", requireAuth, notificationsController.markAllRead);
router.patch("/:id/read", requireAuth, notificationsController.markOneRead);

export default router;
