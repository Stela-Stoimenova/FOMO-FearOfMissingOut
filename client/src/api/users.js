// src/api/users.js
// User-related API calls

import { apiRequest } from "./client.js";

/**
 * GET /api/users/me
 * Get the logged in user's full profile
 */
export async function getMe() {
    return apiRequest("/users/me");
}

/**
 * PUT /api/users/me
 * Update the logged in user's profile
 * @param {object} data - The profile fields to update
 */
export async function updateMe(data) {
    return apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/**
 * GET /api/users/me/loyalty
 * Get the logged in user's loyalty balance and history
 */
export async function getLoyaltyBalance() {
    return apiRequest("/users/me/loyalty");
}

/**
 * GET /api/users/:id
 * Get a user's public profile
 */
export async function getUserProfile(id) {
    return apiRequest(`/users/${id}`);
}

/**
 * POST /api/users/:id/follow
 * Follow a user
 */
export async function followUser(id) {
    return apiRequest(`/users/${id}/follow`, { method: "POST" });
}

/**
 * DELETE /api/users/:id/follow
 * Unfollow a user
 */
export async function unfollowUser(id) {
    return apiRequest(`/users/${id}/follow`, { method: "DELETE" });
}

/**
 * GET /api/users/:id/followers
 * Get a user's followers list
 */
export async function getFollowers(id) {
    return apiRequest(`/users/${id}/followers`);
}

/**
 * GET /api/users/:id/following
 * Get who a user is following
 */
export async function getFollowing(id) {
    return apiRequest(`/users/${id}/following`);
}
