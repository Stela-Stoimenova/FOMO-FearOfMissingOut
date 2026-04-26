import { prisma } from "../db.js";

const DEFAULT_INCLUDE = {
  taggedStudio: { select: { id: true, name: true, avatarUrl: true } },
  taggedAgency: { select: { id: true, name: true, avatarUrl: true } },
};

export async function listByUser(userId) {
  return prisma.cvEntry.findMany({
    where: { userId: Number(userId) },
    orderBy: { startDate: "desc" },
    include: DEFAULT_INCLUDE,
  });
}

export async function create(userId, data) {
  console.log("[cvService] create - User ID:", userId);
  const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { name: true } });
  const entry = await prisma.cvEntry.create({
    data: {
      title: data.title,
      type: data.type,
      description: data.description || null,
      choreographer: data.choreographer || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      taggedStudioId: data.taggedStudioId ? Number(data.taggedStudioId) : null,
      taggedAgencyId: data.taggedAgencyId ? Number(data.taggedAgencyId) : null,
      userId: Number(userId),
    },
    include: DEFAULT_INCLUDE,
  });

  // Notification Messages if tagged
  if (data.taggedStudioId) {
    await prisma.message.create({
      data: {
        senderId: Number(userId),
        receiverId: Number(data.taggedStudioId),
        content: `${user?.name || "A dancer"} tagged your profile in a CV entry: ${data.title}.`
      }
    });
  }
  if (data.taggedAgencyId) {
    await prisma.message.create({
      data: {
        senderId: Number(userId),
        receiverId: Number(data.taggedAgencyId),
        content: `${user?.name || "A dancer"} tagged your profile in a CV entry: ${data.title}.`
      }
    });
  }

  return entry;
}

export async function update(id, userId, data) {
  const entry = await prisma.cvEntry.findUnique({ where: { id: Number(id) } });
  if (!entry) {
    const err = new Error("CV Entry not found");
    err.status = 404;
    throw err;
  }
  if (entry.userId !== Number(userId)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return prisma.cvEntry.update({
    where: { id: Number(id) },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function remove(id, userId) {
  const entry = await prisma.cvEntry.findUnique({ where: { id: Number(id) } });
  if (!entry) {
    const err = new Error("CV Entry not found");
    err.status = 404;
    throw err;
  }
  if (entry.userId !== Number(userId)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return prisma.cvEntry.delete({
    where: { id: Number(id) },
  });
}
