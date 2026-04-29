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

  const existingMessages = await prisma.message.findMany({
    where: {
      senderId: Number(userId),
      OR: [
        data.taggedStudioId ? { receiverId: Number(data.taggedStudioId) } : undefined,
        data.taggedAgencyId ? { receiverId: Number(data.taggedAgencyId) } : undefined,
      ].filter(Boolean),
      createdAt: { gte: new Date(Date.now() - 1000 * 60 * 5) },
    },
  });

  if (data.taggedStudioId) {
    const content = `${user?.name || "A dancer"} tagged your studio in a CV entry: ${data.title}.`;
    const isDuplicate = existingMessages.some(m => m.receiverId === Number(data.taggedStudioId) && m.content === content);
    if (!isDuplicate) {
      await prisma.message.create({
        data: { senderId: Number(userId), receiverId: Number(data.taggedStudioId), content },
      });
    }
  }

  if (data.taggedAgencyId) {
    const content = `${user?.name || "A dancer"} tagged your agency in a CV entry: ${data.title}.`;
    const isDuplicate = existingMessages.some(m => m.receiverId === Number(data.taggedAgencyId) && m.content === content);
    if (!isDuplicate) {
      await prisma.message.create({
        data: { senderId: Number(userId), receiverId: Number(data.taggedAgencyId), content },
      });
    }
  }

  return entry;
}

export async function update(id, userId, data) {
  const entry = await prisma.cvEntry.findUnique({ where: { id: Number(id) } });
  if (!entry) {
    const err = new Error("CV Entry not found"); err.status = 404; throw err;
  }
  if (entry.userId !== Number(userId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  // Explicit field picking prevents userId or other fields from being overwritten
  const update = {};
  if (data.type !== undefined) update.type = data.type;
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description || null;
  if (data.choreographer !== undefined) update.choreographer = data.choreographer || null;
  if (data.startDate !== undefined) update.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) update.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.taggedStudioId !== undefined) update.taggedStudioId = data.taggedStudioId ? Number(data.taggedStudioId) : null;
  if (data.taggedAgencyId !== undefined) update.taggedAgencyId = data.taggedAgencyId ? Number(data.taggedAgencyId) : null;

  return prisma.cvEntry.update({
    where: { id: Number(id) },
    data: update,
    include: DEFAULT_INCLUDE,
  });
}

export async function remove(id, userId) {
  const entry = await prisma.cvEntry.findUnique({ where: { id: Number(id) } });
  if (!entry) {
    const err = new Error("CV Entry not found"); err.status = 404; throw err;
  }
  if (entry.userId !== Number(userId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  return prisma.cvEntry.delete({ where: { id: Number(id) } });
}
