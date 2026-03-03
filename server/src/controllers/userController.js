import {
    getMyProfile,
    getUserProfile,
    getLoyaltyBalance,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
} from "../services/userService.js";

export async function getMe(req, res, next) {
    try {
        const profile = await getMyProfile(req.user.userId);
        return res.json(profile);
    } catch (err) {
        return next(err);
    }
}

export async function getProfile(req, res, next) {
    try {
        const id = Number(req.params.id);
        const profile = await getUserProfile(id);
        return res.json(profile);
    } catch (err) {
        return next(err);
    }
}

export async function loyaltyBalance(req, res, next) {
    try {
        const balance = await getLoyaltyBalance(req.user.userId);
        return res.json(balance);
    } catch (err) {
        return next(err);
    }
}

export async function follow(req, res, next) {
    try {
        const followingId = Number(req.params.id);
        const result = await followUser(req.user.userId, followingId);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function unfollow(req, res, next) {
    try {
        const followingId = Number(req.params.id);
        const result = await unfollowUser(req.user.userId, followingId);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function followers(req, res, next) {
    try {
        const id = Number(req.params.id);
        const list = await getFollowers(id);
        return res.json(list);
    } catch (err) {
        return next(err);
    }
}

export async function following(req, res, next) {
    try {
        const id = Number(req.params.id);
        const list = await getFollowing(id);
        return res.json(list);
    } catch (err) {
        return next(err);
    }
}
