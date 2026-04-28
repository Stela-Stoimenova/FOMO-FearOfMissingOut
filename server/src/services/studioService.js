import { prisma } from "../db.js";

// --- Weekly Classes ---
export async function listClasses(studioId) {
  return prisma.weeklyClass.findMany({
    where: { studioId: Number(studioId) },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: { teacher: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function createClass(studioId, data) {
  return prisma.weeklyClass.create({
    data: {
      studioId: Number(studioId),
      title: data.title,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      style: data.style,
      level: data.level,
      teacherId: data.teacherId ? Number(data.teacherId) : null,
      teacherName: data.teacherName || null,
      capacity: data.capacity ? Number(data.capacity) : null,
    },
    include: { teacher: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function updateClass(id, studioId, data) {
  const c = await prisma.weeklyClass.findUnique({ where: { id: Number(id) } });
  if (!c) {
    const err = new Error("Class not found"); err.status = 404; throw err;
  }
  if (c.studioId !== Number(studioId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  // Explicit field picking prevents studioId or other fields from being overwritten
  const update = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.dayOfWeek !== undefined) update.dayOfWeek = data.dayOfWeek;
  if (data.startTime !== undefined) update.startTime = data.startTime;
  if (data.endTime !== undefined) update.endTime = data.endTime;
  if (data.style !== undefined) update.style = data.style;
  if (data.level !== undefined) update.level = data.level;
  if (data.teacherName !== undefined) update.teacherName = data.teacherName || null;
  if (data.teacherId !== undefined) update.teacherId = data.teacherId ? Number(data.teacherId) : null;
  if (data.capacity !== undefined) update.capacity = data.capacity ? Number(data.capacity) : null;

  return prisma.weeklyClass.update({
    where: { id: Number(id) },
    data: update,
    include: { teacher: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function removeClass(id, studioId) {
  const c = await prisma.weeklyClass.findUnique({ where: { id: Number(id) } });
  if (!c) {
    const err = new Error("Class not found"); err.status = 404; throw err;
  }
  if (c.studioId !== Number(studioId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  return prisma.weeklyClass.delete({ where: { id: Number(id) } });
}

// --- Membership Tiers ---

// Public: only active tiers
export async function listMemberships(studioId) {
  return prisma.membershipTier.findMany({
    where: { studioId: Number(studioId), isActive: true },
    orderBy: { priceCents: "asc" },
  });
}

// Studio owner: all tiers including inactive
export async function listAllMemberships(studioId) {
  return prisma.membershipTier.findMany({
    where: { studioId: Number(studioId) },
    orderBy: { priceCents: "asc" },
  });
}

export async function createMembership(studioId, data) {
  return prisma.membershipTier.create({
    data: {
      studioId: Number(studioId),
      name: data.name,
      description: data.description || null,
      priceCents: Number(data.priceCents),
      classLimit: data.classLimit ? Number(data.classLimit) : null,
      durationDays: Number(data.durationDays),
    },
  });
}

export async function updateMembership(id, studioId, data) {
  const m = await prisma.membershipTier.findUnique({ where: { id: Number(id) } });
  if (!m) {
    const err = new Error("Membership not found"); err.status = 404; throw err;
  }
  if (m.studioId !== Number(studioId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  // Explicit field picking prevents studioId or other restricted fields from being overwritten
  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description || null;
  if (data.priceCents !== undefined) update.priceCents = Number(data.priceCents);
  if (data.classLimit !== undefined) update.classLimit = data.classLimit ? Number(data.classLimit) : null;
  if (data.durationDays !== undefined) update.durationDays = Number(data.durationDays);
  if (data.isActive !== undefined) update.isActive = Boolean(data.isActive);

  return prisma.membershipTier.update({
    where: { id: Number(id) },
    data: update,
  });
}

export async function removeMembership(id, studioId) {
  const m = await prisma.membershipTier.findUnique({ where: { id: Number(id) } });
  if (!m) {
    const err = new Error("Membership not found"); err.status = 404; throw err;
  }
  if (m.studioId !== Number(studioId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  // If there are active memberships, soft-deactivate instead of hard delete to preserve data integrity
  const activeCount = await prisma.userMembership.count({
    where: { tierId: Number(id), active: true },
  });
  if (activeCount > 0) {
    return prisma.membershipTier.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });
  }
  return prisma.membershipTier.delete({ where: { id: Number(id) } });
}

export async function purchaseMembership(tierId, dancerId) {
  const tier = await prisma.membershipTier.findUnique({ where: { id: Number(tierId) } });
  if (!tier || !tier.isActive) {
    const err = new Error("Membership tier not found or inactive"); err.status = 404; throw err;
  }

  // Prevent duplicate active membership for the same tier
  const existing = await prisma.userMembership.findFirst({
    where: { tierId: Number(tierId), dancerId: Number(dancerId), active: true },
  });
  if (existing) {
    const err = new Error("You already have an active membership for this plan"); err.status = 409; throw err;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + tier.durationDays);

  return prisma.userMembership.create({
    data: {
      dancerId: Number(dancerId),
      tierId: Number(tierId),
      creditsTotal: tier.classLimit,
      expiresAt,
    },
    include: { tier: { include: { studio: { select: { id: true, name: true } } } } },
  });
}

// Dancer's purchased memberships
export async function getMyMemberships(dancerId) {
  return prisma.userMembership.findMany({
    where: { dancerId: Number(dancerId) },
    orderBy: { createdAt: "desc" },
    include: {
      tier: {
        include: {
          studio: { select: { id: true, name: true, avatarUrl: true, city: true } },
        },
      },
    },
  });
}

// --- Studio Team ---
export async function listTeam(studioId) {
  return prisma.studioTeamMember.findMany({
    where: { studioId: Number(studioId) },
    orderBy: { joinedAt: "asc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
  });
}

export async function addTeamMember(studioId, data) {
  const studio = await prisma.user.findUnique({ where: { id: Number(studioId) }, select: { name: true } });
  const member = await prisma.studioTeamMember.create({
    data: {
      studioId: Number(studioId),
      userId: Number(data.userId),
      role: data.role,
    },
    include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
  });

  const content = `${studio?.name || "A studio"} added you to their studio team as ${data.role}.`;
  const existing = await prisma.message.findFirst({
    where: {
      senderId: Number(studioId),
      receiverId: Number(data.userId),
      content,
      createdAt: { gte: new Date(Date.now() - 1000 * 60 * 5) },
    },
  });
  if (!existing) {
    await prisma.message.create({
      data: { senderId: Number(studioId), receiverId: Number(data.userId), content },
    });
  }

  return member;
}

export async function removeTeamMember(id, studioId) {
  const m = await prisma.studioTeamMember.findUnique({ where: { id: Number(id) } });
  if (!m) {
    const err = new Error("Team member not found"); err.status = 404; throw err;
  }
  if (m.studioId !== Number(studioId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }
  return prisma.studioTeamMember.delete({ where: { id: Number(id) } });
}

// --- Collaborations ---
export async function listCollaborations(studioId) {
  return prisma.collaboration.findMany({
    where: {
      studioId: Number(studioId),
      status: { in: ["PENDING", "ACTIVE"] },
    },
    orderBy: { createdAt: "desc" },
    include: { agency: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function addCollaboration(studioId, data) {
  const studio = await prisma.user.findUnique({ where: { id: Number(studioId) }, select: { name: true } });
  const agency = await prisma.user.findUnique({ where: { id: Number(data.agencyId) } });
  if (!agency || agency.role !== "AGENCY") {
    const err = new Error("Target user is not an AGENCY"); err.status = 400; throw err;
  }

  const collab = await prisma.collaboration.create({
    data: {
      studioId: Number(studioId),
      agencyId: Number(data.agencyId),
      description: data.description || null,
      // status defaults to PENDING — agency must accept
    },
    include: { agency: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const content = `${studio?.name || "A studio"} sent you a collaboration request.`;
  const existing = await prisma.message.findFirst({
    where: {
      senderId: Number(studioId),
      receiverId: Number(data.agencyId),
      content,
      createdAt: { gte: new Date(Date.now() - 1000 * 60 * 5) },
    },
  });
  if (!existing) {
    await prisma.message.create({
      data: { senderId: Number(studioId), receiverId: Number(data.agencyId), content },
    });
  }

  return collab;
}

export async function removeCollaboration(agencyId, studioId) {
  const c = await prisma.collaboration.findUnique({
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } },
  });
  if (!c) {
    const err = new Error("Collaboration not found"); err.status = 404; throw err;
  }
  return prisma.collaboration.delete({
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } },
  });
}
