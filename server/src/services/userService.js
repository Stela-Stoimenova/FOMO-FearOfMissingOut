import { prisma } from "../db.js";
import { createNotification } from "./notificationService.js";

/** Public profile of any user */
export async function getUserProfile(id) {
    if (!Number.isInteger(id)) {
        const err = new Error("Invalid user id");
        err.status = 400;
        throw err;
    }

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            bio: true,
            city: true,
            danceStyles: true,
            experienceLevel: true,
            portfolioLinks: true,
            createdAt: true,
            portfolioItems: { orderBy: { createdAt: 'desc' } },
            taggedEvents: {
                select: { id: true, title: true, imageUrl: true, startAt: true, location: true },
                orderBy: { startAt: 'desc' },
                take: 10
            },
            _count: {
                select: { followers: true, following: true },
            },
        },
    });

    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    return user;
}

/** Own profile – includes loyalty balance */
export async function getMyProfile(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
            bio: true,
            city: true,
            danceStyles: true,
            experienceLevel: true,
            portfolioLinks: true,
            payoutDetails: true,
            createdAt: true,
            portfolioItems: { orderBy: { createdAt: 'desc' } },
            taggedEvents: {
                select: { id: true, title: true, imageUrl: true, startAt: true, location: true },
                orderBy: { startAt: 'desc' },
                take: 10,
            },
            _count: {
                select: { followers: true, following: true },
            },
            loyaltyAccount: {
                select: { points: true, updatedAt: true },
            },
        },
    });

    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    return user;
}

/** Update own profile */
export async function updateMyProfile(userId, fields) {
    const data = {};

    // Safely pick only the fields we allow to be changed
    if (fields.name !== undefined) data.name = fields.name;
    if (fields.avatarUrl !== undefined) data.avatarUrl = fields.avatarUrl || null;
    if (fields.bio !== undefined) data.bio = fields.bio || null;
    if (fields.city !== undefined) data.city = fields.city || null;
    if (fields.danceStyles !== undefined) data.danceStyles = fields.danceStyles;
    if (fields.experienceLevel !== undefined) data.experienceLevel = fields.experienceLevel || null;
    if (fields.portfolioLinks !== undefined) data.portfolioLinks = fields.portfolioLinks;
    if (fields.payoutDetails !== undefined) data.payoutDetails = fields.payoutDetails || null;

    const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
            bio: true,
            city: true,
            danceStyles: true,
            experienceLevel: true,
            portfolioLinks: true,
            payoutDetails: true,
        },
    });

    return updated;
}

/** Get loyalty balance, create account with 0 points if it doesn't exist yet */
export async function getLoyaltyBalance(userId) {
    const account = await prisma.loyaltyAccount.upsert({
        where: { userId },
        create: { userId, points: 0 },
        update: {},
        select: { points: true, updatedAt: true },
    });

    const history = await prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, points: true, reason: true, createdAt: true },
    });

    return { points: account.points, updatedAt: account.updatedAt, history };
}

/** Follow a user */
export async function followUser(followerId, followingId) {
    if (followerId === followingId) {
        const err = new Error("You cannot follow yourself");
        err.status = 400;
        throw err;
    }

    // Verify target user exists
    const target = await prisma.user.findUnique({ where: { id: followingId } });
    if (!target) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    try {
        await prisma.follow.create({
            data: { followerId, followingId },
        });
    } catch (err) {
        if (String(err).includes("Unique constraint") || String(err).includes("already exists")) {
            const dupErr = new Error("You are already following this user");
            dupErr.status = 409;
            throw dupErr;
        }
        throw err;
    }

    const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { name: true } });
    createNotification({
        userId: followingId,
        actorId: followerId,
        type: "FOLLOW",
        message: `${follower?.name || "Someone"} started following you.`,
        linkPath: `/users/${followerId}`,
    }).catch(() => {});

    return { followerId, followingId, followed: true };
}

/** Unfollow a user */
export async function unfollowUser(followerId, followingId) {
    const existing = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
    });

    if (!existing) {
        const err = new Error("You are not following this user");
        err.status = 400;
        throw err;
    }

    await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
    });

    return { followerId, followingId, followed: false };
}

/** List followers of a user */
export async function getFollowers(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    const rows = await prisma.follow.findMany({
        where: { followingId: userId },
        orderBy: { createdAt: "desc" },
        include: {
            follower: { select: { id: true, name: true, role: true } },
        },
    });

    return rows.map((r) => ({ ...r.follower, followedAt: r.createdAt }));
}

/** List users a user is following */
export async function getFollowing(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }

    const rows = await prisma.follow.findMany({
        where: { followerId: userId },
        orderBy: { createdAt: "desc" },
        include: {
            following: { select: { id: true, name: true, role: true } },
        },
    });

    return rows.map((r) => ({ ...r.following, followedAt: r.createdAt }));
}

/** Search users by name, role, city, style */
export async function searchUsers(filters) {
    const { query, role, city, style } = filters;
    const where = {};

    if (query) {
        where.name = { contains: query, mode: "insensitive" };
    }
    if (role) where.role = role;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (style) {
        where.danceStyles = { has: style };
    }

    return prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            city: true,
            danceStyles: true,
            experienceLevel: true,
            _count: { select: { followers: true, following: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
}

/** Add a portfolio item */
export async function addPortfolioItem(userId, data) {
    return prisma.portfolioItem.create({
        data: {
            userId,
            type: data.type || "VIDEO",
            url: data.url,
            title: data.title || null,
            description: data.description || null
        }
    });
}

/** Delete a portfolio item */
export async function deletePortfolioItem(userId, itemId) {
    const item = await prisma.portfolioItem.findUnique({ where: { id: itemId } });
    if (!item || item.userId !== userId) {
        const err = new Error("Not found or unauthorized");
        err.status = 404;
        throw err;
    }
    await prisma.portfolioItem.delete({ where: { id: itemId } });
    return { success: true };
}

/** Toggle event tag (attended/performing) */
export async function toggleEventTag(userId, eventId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { taggedEvents: { where: { id: eventId } } }
    });

    if (!user) throw new Error("User not found");

    const isTagged = user.taggedEvents.length > 0;

    if (isTagged) {
        await prisma.user.update({
            where: { id: userId },
            data: { taggedEvents: { disconnect: { id: eventId } } }
        });
        return { tagged: false };
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: { taggedEvents: { connect: { id: eventId } } }
        });
        return { tagged: true };
    }
}

/** Delete own account and all related data (handled by DB cascade) */
export async function deleteUserAccount(userId) {
    // Cascades on most models are set in prisma schema.
    // Some logic might be needed if external assets (images) need cleanup.
    return prisma.user.delete({
        where: { id: userId },
    });
}

/** Invites and Requests for Dancers */
export async function getMyInvites(userId) {
    const [roster, team] = await Promise.all([
        prisma.agencyRoster.findMany({
            where: { dancerId: userId, status: "PENDING" },
            include: { agency: { select: { id: true, name: true, avatarUrl: true } } }
        }),
        prisma.studioTeamMember.findMany({
            where: { userId: userId, status: "PENDING" },
            include: { studio: { select: { id: true, name: true, avatarUrl: true } } }
        })
    ]);
    return { rosterInvites: roster, teamInvites: team };
}

export async function acceptRosterInvite(userId, id) {
    const entry = await prisma.agencyRoster.findUnique({ where: { id: Number(id) } });
    if (!entry || entry.dancerId !== userId) {
        const err = new Error("Not found"); err.status = 404; throw err;
    }
    return prisma.agencyRoster.update({
        where: { id: Number(id) },
        data: { status: "ACTIVE" }
    });
}

export async function declineRosterInvite(userId, id) {
    const entry = await prisma.agencyRoster.findUnique({ where: { id: Number(id) } });
    if (!entry || entry.dancerId !== userId) {
        const err = new Error("Not found"); err.status = 404; throw err;
    }
    return prisma.agencyRoster.delete({ where: { id: Number(id) } });
}

export async function acceptTeamInvite(userId, id) {
    const entry = await prisma.studioTeamMember.findUnique({ where: { id: Number(id) } });
    if (!entry || entry.userId !== userId) {
        const err = new Error("Not found"); err.status = 404; throw err;
    }
    return prisma.studioTeamMember.update({
        where: { id: Number(id) },
        data: { status: "ACTIVE" }
    });
}

export async function declineTeamInvite(userId, id) {
    const entry = await prisma.studioTeamMember.findUnique({ where: { id: Number(id) } });
    if (!entry || entry.userId !== userId) {
        const err = new Error("Not found"); err.status = 404; throw err;
    }
    return prisma.studioTeamMember.delete({ where: { id: Number(id) } });
}

/** Get AI recommended dancers for Studios/Agencies based on their profile */
export async function getRecommendedDancers(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, city: true, danceStyles: true }
    });

    if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        throw err;
    }
    
    if (user.role !== "STUDIO" && user.role !== "AGENCY") {
        const err = new Error("Only studios and agencies can get recommendations");
        err.status = 403;
        throw err;
    }

    const { city, danceStyles } = user;

    // Fetch potential dancers
    const dancers = await prisma.user.findMany({
        where: { role: "DANCER" },
        select: {
            id: true, name: true, avatarUrl: true, city: true,
            danceStyles: true, experienceLevel: true, bio: true,
            _count: { select: { followers: true } }
        },
        take: 150
    });

    const EXPERIENCE_SCORES = {
        PROFESSIONAL: 15,
        ADVANCED: 10,
        INTERMEDIATE: 5,
        BEGINNER: 0,
    };

    const scored = dancers.map(dancer => {
        let score = 0;
        
        // Match styles (high weight) — 20 pts per matching style
        if (danceStyles && danceStyles.length > 0 && dancer.danceStyles?.length > 0) {
            const overlap = dancer.danceStyles.filter(s => danceStyles.includes(s)).length;
            score += overlap * 20;
        }

        // Match city (medium weight)
        if (city && dancer.city && city.toLowerCase() === dancer.city.toLowerCase()) {
            score += 15;
        }

        // Experience level bonus
        score += EXPERIENCE_SCORES[dancer.experienceLevel] ?? 0;

        // Profile completeness bonus
        if (dancer.bio) score += 5;
        if (dancer.avatarUrl) score += 5;
        if (dancer.danceStyles?.length > 0) score += 5;

        // Follower tiebreaker (small weight so it doesn't dominate)
        score += Math.min(dancer._count.followers * 0.5, 10);

        // Normalize to 0-100
        const normalizedScore = Math.min(Math.round(score), 100);

        // Build human-readable match reasons
        const matchReasons = [];
        if (danceStyles && danceStyles.length > 0 && dancer.danceStyles?.length > 0) {
            const overlap = dancer.danceStyles.filter(s => danceStyles.includes(s));
            if (overlap.length > 0) {
                matchReasons.push(`${overlap.length} shared style${overlap.length > 1 ? 's' : ''}: ${overlap.join(', ')}`);
            }
        }
        if (city && dancer.city && city.toLowerCase() === dancer.city.toLowerCase()) {
            matchReasons.push(`Same city: ${dancer.city}`);
        }
        if (dancer.experienceLevel && dancer.experienceLevel !== 'BEGINNER') {
            const levelLabel = dancer.experienceLevel.charAt(0) + dancer.experienceLevel.slice(1).toLowerCase().replace('_', ' ');
            matchReasons.push(`${levelLabel} level`);
        }

        return { ...dancer, matchScore: normalizedScore, matchReasons };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

    return scored;
}

