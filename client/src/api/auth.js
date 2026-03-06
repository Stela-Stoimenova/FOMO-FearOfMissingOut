// src/api/auth.js
// Auth-related API calls — login and register

import { apiRequest } from "./client.js";

/**
 * POST /api/auth/login
 * @param {{ email: string, password: string }} credentials
 * @returns {{ user, token }}
 */
export async function loginUser(credentials) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}

/**
 * POST /api/auth/register
 * @param {{ email: string, password: string, name?: string, role: string }} data
 * @returns {{ user, token }}
 */
export async function registerUser(data) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}
