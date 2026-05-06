import { prisma } from "../db.js";

export async function createNotification({ userId, actorId, type, message, linkPath }) {
  return prisma.notification.create({
    data: {
      userId: Number(userId),
      actorId: actorId ? Number(actorId) : null,
      type,
      message,
      linkPath: linkPath || null,
    },
  });
}

export async function getNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId: Number(userId), isRead: false },
  });
}

export async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId: Number(userId), isRead: false },
    data: { isRead: true },
  });
}

export async function markOneRead(userId, notificationId) {
  const n = await prisma.notification.findUnique({ where: { id: Number(notificationId) } });
  if (!n || n.userId !== Number(userId)) {
    const err = new Error("Not found"); err.status = 404; throw err;
  }
  return prisma.notification.update({
    where: { id: Number(notificationId) },
    data: { isRead: true },
  });
}
