// src/api/users.js
// User-related API calls

import { apiRequest } from "./client.js";

/**
 * GET /api/users/me
 * Get the logged in user's profile
 */
export async function getMe() {
    return apiRequest("/users/me");
}

/**
 * PUT /api/users/me
 * Update the logged in user's profile
 * @param {object} data - The profile fields to update (e.g., { avatarUrl: string })
 */
export async function updateMe(data) {
    return apiRequest("/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

/**
 * GET /api/users/me/loyalty
 * Get the logged in user's loyalty balance
 */
export async function getLoyaltyBalance() {
    return apiRequest("/users/me/loyalty");
}
