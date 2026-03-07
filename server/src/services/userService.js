import { prisma } from "../db.js";

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
            createdAt: true,
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
            createdAt: true,
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

/** Update own profile (e.g., avatarUrl) */
export async function updateMyProfile(userId, { avatarUrl }) {
    const data = {};
    if (avatarUrl !== undefined) {
        data.avatarUrl = avatarUrl;
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            role: true,
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
