import { prisma } from "../db.js";
import { createNotification } from "./notificationService.js";

// --- Agency Collaborations (from agency's perspective) ---

export async function sendCollaborationInvite(agencyId, data) {
  const studio = await prisma.user.findUnique({ where: { id: Number(data.studioId) } });
  if (!studio || studio.role !== "STUDIO") {
    const err = new Error("Target user is not a STUDIO"); err.status = 400; throw err;
  }

  const agency = await prisma.user.findUnique({ where: { id: Number(agencyId) }, select: { name: true } });

  try {
    const collab = await prisma.collaboration.create({
      data: {
        studioId: Number(data.studioId),
        agencyId: Number(agencyId),
        description: data.description || null,
        initiatedBy: "AGENCY",
      },
      include: { studio: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const content = `${agency?.name || "An agency"} sent you a collaboration invite.`;
    const existing = await prisma.message.findFirst({
      where: {
        senderId: Number(agencyId),
        receiverId: Number(data.studioId),
        content,
        createdAt: { gte: new Date(Date.now() - 1000 * 60 * 5) },
      },
    });
    if (!existing) {
      await prisma.message.create({
        data: { senderId: Number(agencyId), receiverId: Number(data.studioId), content },
      });
    }
    createNotification({
      userId: Number(data.studioId),
      actorId: Number(agencyId),
      type: "COLLAB_REQUEST",
      message: content,
      linkPath: `/dashboard`,
    }).catch(() => {});

    return collab;
  } catch (err) {
    if (String(err).includes("Unique constraint")) {
      const dupErr = new Error("A collaboration with this studio already exists"); dupErr.status = 409; throw dupErr;
    }
    throw err;
  }
}

export async function getAgencyCollaborations(agencyId) {
  return prisma.collaboration.findMany({
    where: { agencyId: Number(agencyId) },
    orderBy: { createdAt: "desc" },
    include: { studio: { select: { id: true, name: true, avatarUrl: true, city: true } } },
  });
}

export async function acceptCollaboration(agencyId, studioId) {
  const collab = await prisma.collaboration.findUnique({
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } },
  });
  if (!collab) {
    const err = new Error("Collaboration request not found"); err.status = 404; throw err;
  }
  if (collab.agencyId !== Number(agencyId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }

  const updated = await prisma.collaboration.update({
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } },
    data: { status: "ACTIVE" },
    include: { studio: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Notify the studio
  const agency = await prisma.user.findUnique({ where: { id: Number(agencyId) }, select: { name: true } });
  await prisma.message.create({
    data: {
      senderId: Number(agencyId),
      receiverId: Number(studioId),
      content: `${agency?.name || "An agency"} accepted your collaboration request.`,
    },
  });
  createNotification({
    userId: Number(studioId),
    actorId: Number(agencyId),
    type: "COLLAB_ACCEPTED",
    message: `${agency?.name || "An agency"} accepted your collaboration request.`,
    linkPath: `/users/${agencyId}`,
  }).catch(() => {});

  return updated;
}

export async function declineCollaboration(agencyId, studioId) {
  const collab = await prisma.collaboration.findUnique({
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } },
  });
  if (!collab) {
    const err = new Error("Collaboration request not found"); err.status = 404; throw err;
  }
  if (collab.agencyId !== Number(agencyId)) {
    const err = new Error("Forbidden"); err.status = 403; throw err;
  }

  await prisma.collaboration.delete({
    where: { studioId_agencyId: { studioId: Number(studioId), agencyId: Number(agencyId) } },
  });

  // Notify the studio
  const agency = await prisma.user.findUnique({ where: { id: Number(agencyId) }, select: { name: true } });
  await prisma.message.create({
    data: {
      senderId: Number(agencyId),
      receiverId: Number(studioId),
      content: `${agency?.name || "An agency"} declined your collaboration request.`,
    },
  });
  createNotification({
    userId: Number(studioId),
    actorId: Number(agencyId),
    type: "COLLAB_DECLINED",
    message: `${agency?.name || "An agency"} declined your collaboration request.`,
    linkPath: `/users/${agencyId}`,
  }).catch(() => {});

  return { declined: true };
}

// --- Agency Roster (managed dancers) ---

export async function getAgencyRoster(agencyId) {
  return prisma.agencyRoster.findMany({
    where: { agencyId: Number(agencyId) },
    orderBy: { createdAt: "asc" },
    include: {
      dancer: {
        select: {
          id: true, name: true, avatarUrl: true, city: true,
          danceStyles: true, experienceLevel: true,
          _count: { select: { followers: true } },
        },
      },
    },
  });
}

export async function addToRoster(agencyId, data) {
  const dancer = await prisma.user.findUnique({ where: { id: Number(data.dancerId) } });
  if (!dancer) {
    const err = new Error("User not found"); err.status = 404; throw err;
  }
  if (dancer.role !== "DANCER") {
    const err = new Error("Target user is not a DANCER"); err.status = 400; throw err;
  }

  try {
    const entry = await prisma.agencyRoster.create({
      data: {
        agencyId: Number(agencyId),
        dancerId: Number(data.dancerId),
        notes: data.notes || null,
      },
      include: {
        dancer: {
          select: {
            id: true, name: true, avatarUrl: true, city: true,
            danceStyles: true, experienceLevel: true,
          },
        },
      },
    });

    // Notify the dancer
    const agency = await prisma.user.findUnique({ where: { id: Number(agencyId) }, select: { name: true } });
    const rosterMsg = `${agency?.name || "An agency"} added you to their talent roster.`;
    await prisma.message.create({
      data: {
        senderId: Number(agencyId),
        receiverId: Number(data.dancerId),
        content: rosterMsg,
      },
    });
    createNotification({
      userId: Number(data.dancerId),
      actorId: Number(agencyId),
      type: "ROSTER_INVITE",
      message: rosterMsg,
      linkPath: `/users/${agencyId}`,
    }).catch(() => {});

    return entry;
  } catch (err) {
    if (String(err).includes("Unique constraint")) {
      const dupErr = new Error("This dancer is already on your roster"); dupErr.status = 409; throw dupErr;
    }
    throw err;
  }
}

export async function removeFromRoster(agencyId, dancerId) {
  const entry = await prisma.agencyRoster.findUnique({
    where: { agencyId_dancerId: { agencyId: Number(agencyId), dancerId: Number(dancerId) } },
  });
  if (!entry) {
    const err = new Error("Roster entry not found"); err.status = 404; throw err;
  }
  return prisma.agencyRoster.delete({
    where: { agencyId_dancerId: { agencyId: Number(agencyId), dancerId: Number(dancerId) } },
  });
}

// --- Public agency views (no auth required) ---

export async function getPublicRoster(agencyId) {
  return prisma.agencyRoster.findMany({
    where: { agencyId: Number(agencyId), status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    include: {
      dancer: {
        select: {
          id: true, name: true, avatarUrl: true, city: true,
          danceStyles: true, experienceLevel: true,
        },
      },
    },
  });
}

export async function getPublicCollaborations(agencyId) {
  return prisma.collaboration.findMany({
    where: { agencyId: Number(agencyId), status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { studio: { select: { id: true, name: true, avatarUrl: true, city: true } } },
  });
}

export async function getPublicCvTags(agencyId) {
  return prisma.cvEntry.findMany({
    where: { taggedAgencyId: Number(agencyId), verificationStatus: "VERIFIED" },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

// --- CV Entries tagged with this agency ---

export async function getTaggedCvEntries(agencyId) {
  return prisma.cvEntry.findMany({
    where: { taggedAgencyId: Number(agencyId) },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, city: true, danceStyles: true } },
      taggedStudio: { select: { id: true, name: true } },
    },
  });
}

export async function acceptCvTag(agencyId, cvId) {
  const cv = await prisma.cvEntry.findUnique({ where: { id: Number(cvId) } });
  if (!cv || cv.taggedAgencyId !== Number(agencyId)) {
    const err = new Error("Not found"); err.status = 404; throw err;
  }
  const updated = await prisma.cvEntry.update({
    where: { id: Number(cvId) },
    data: { verificationStatus: "VERIFIED" }
  });
  const agency = await prisma.user.findUnique({ where: { id: Number(agencyId) }, select: { name: true } });
  createNotification({
    userId: cv.userId,
    actorId: Number(agencyId),
    type: "CV_TAG_ACCEPTED",
    message: `${agency?.name || "An agency"} verified your CV entry "${cv.title}".`,
    linkPath: `/users/${cv.userId}`,
  }).catch(() => {});
  return updated;
}

export async function declineCvTag(agencyId, cvId) {
  const cv = await prisma.cvEntry.findUnique({ where: { id: Number(cvId) } });
  if (!cv || cv.taggedAgencyId !== Number(agencyId)) {
    const err = new Error("Not found"); err.status = 404; throw err;
  }
  const updated = await prisma.cvEntry.update({
    where: { id: Number(cvId) },
    data: { verificationStatus: "REJECTED" }
  });
  const agency = await prisma.user.findUnique({ where: { id: Number(agencyId) }, select: { name: true } });
  createNotification({
    userId: cv.userId,
    actorId: Number(agencyId),
    type: "CV_TAG_DECLINED",
    message: `${agency?.name || "An agency"} declined your CV entry "${cv.title}".`,
    linkPath: `/users/${cv.userId}`,
  }).catch(() => {});
  return updated;
}
