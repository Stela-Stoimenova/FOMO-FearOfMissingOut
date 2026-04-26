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
    data: { ...data, studioId: Number(studioId) },
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
  return prisma.weeklyClass.update({
    where: { id: Number(id) },
    data,
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
export async function listMemberships(studioId) {
  return prisma.membershipTier.findMany({
    where: { studioId: Number(studioId) },
    orderBy: { priceCents: "asc" },
  });
}

export async function createMembership(studioId, data) {
  return prisma.membershipTier.create({
    data: { ...data, studioId: Number(studioId) },
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
  return prisma.membershipTier.update({
    where: { id: Number(id) },
    data,
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
  return prisma.membershipTier.delete({ where: { id: Number(id) } });
}

export async function purchaseMembership(tierId, dancerId) {
  const tier = await prisma.membershipTier.findUnique({ where: { id: Number(tierId) } });
  if (!tier || !tier.isActive) {
    const err = new Error("Membership tier not found or inactive"); err.status = 404; throw err;
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
    include: { tier: { include: { studio: { select: { id: true, name: true } } } } }
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
  return prisma.studioTeamMember.create({
    data: { ...data, studioId: Number(studioId) },
    include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
  });
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
    where: { studioId: Number(studioId) },
    orderBy: { createdAt: "desc" },
    include: { agency: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function addCollaboration(studioId, data) {
  const agency = await prisma.user.findUnique({ where: { id: Number(data.agencyId) } });
  if (!agency || agency.role !== "AGENCY") {
    const err = new Error("Target user is not an AGENCY"); err.status = 400; throw err;
  }

  return prisma.collaboration.create({
    data: { ...data, studioId: Number(studioId) },
    include: { agency: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function removeCollaboration(agencyId, studioId) {
  const c = await prisma.collaboration.findUnique({ 
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } } 
  });
  if (!c) {
    const err = new Error("Collaboration not found"); err.status = 404; throw err;
  }
  return prisma.collaboration.delete({ 
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } } 
  });
}
