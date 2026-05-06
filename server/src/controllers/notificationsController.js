import * as notificationService from "../services/notificationService.js";

export async function getNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getNotifications(req.user.userId);
    res.json(notifications);
  } catch (err) { next(err); }
}

export async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationService.getUnreadCount(req.user.userId);
    res.json({ count });
  } catch (err) { next(err); }
}

export async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user.userId);
    res.json({ ok: true });
  } catch (err) { next(err); }
}

export async function markOneRead(req, res, next) {
  try {
    const n = await notificationService.markOneRead(req.user.userId, req.params.id);
    res.json(n);
  } catch (err) { next(err); }
}
