import {
    getMyProfile,
    getUserProfile,
    updateMyProfile,
    getLoyaltyBalance,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    searchUsers,
    addPortfolioItem,
    deletePortfolioItem,
    toggleEventTag,
    deleteUserAccount
} from "../services/userService.js";

export async function getMe(req, res, next) {
    try {
        const profile = await getMyProfile(req.user.userId);
        return res.json(profile);
    } catch (err) {
        return next(err);
    }
}

export async function deleteMe(req, res, next) {
    try {
        await deleteUserAccount(req.user.userId);
        return res.status(204).send();
    } catch (err) {
        return next(err);
    }
}


export async function updateMe(req, res, next) {
    try {
        const updated = await updateMyProfile(req.user.userId, req.body);
        return res.json(updated);
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

export async function search(req, res, next) {
    try {
        const results = await searchUsers(req.query);
        return res.json(results);
    } catch (err) {
        return next(err);
    }
}

export async function createPortfolioItem(req, res, next) {
    try {
        const item = await addPortfolioItem(req.user.userId, req.body);
        return res.status(201).json(item);
    } catch (err) {
        return next(err);
    }
}

export async function removePortfolioItem(req, res, next) {
    try {
        const itemId = Number(req.params.itemId);
        const result = await deletePortfolioItem(req.user.userId, itemId);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}

export async function tagEvent(req, res, next) {
    try {
        const eventId = Number(req.params.eventId);
        const result = await toggleEventTag(req.user.userId, eventId);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
}
