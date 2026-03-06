// src/api/client.js
// Base API helper — all requests go through here.
// Change BASE_URL once and it applies everywhere.

const BASE_URL = "http://localhost:5000/api";

/**
 * Makes a fetch request and returns parsed JSON.
 * Throws an error (with message from the server) if the response is not OK.
 *
 * @param {string} path      - e.g. "/events" or "/auth/login"
 * @param {RequestInit} options - standard fetch options (method, body, headers…)
 */
export async function apiRequest(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            // If a JWT token is stored, attach it automatically
            ...(localStorage.getItem("token")
                ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
                : {}),
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json();

    // If the server returned an error, throw it so callers can catch it
    if (!response.ok) {
        const message = data?.error?.message || "Something went wrong";
        const err = new Error(message);
        err.status = response.status;
        throw err;
    }

    return data;
}
