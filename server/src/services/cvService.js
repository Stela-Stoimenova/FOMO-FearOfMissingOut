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
  return prisma.cvEntry.create({
    data: {
      ...data,
      userId: Number(userId),
    },
    include: DEFAULT_INCLUDE,
  });
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
