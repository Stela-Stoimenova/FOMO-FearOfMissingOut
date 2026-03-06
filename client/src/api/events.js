// src/api/events.js
// All event-related API calls in one place.
// Each function maps to one backend endpoint.

import { apiRequest } from "./client.js";

/**
 * GET /api/events
 * Fetch a paginated, filtered list of events.
 *
 * @param {object} params - optional filters
 * @param {string} params.q        - search query
 * @param {string} params.city     - city filter
 * @param {number} params.page     - page number (default 1)
 * @param {number} params.limit    - results per page (default 10)
 * @param {number} params.minPrice - min price in cents
 * @param {number} params.maxPrice - max price in cents
 *
 * @returns {{ items: Event[], total: number, page: number, limit: number }}
 */
export async function getEvents(params = {}) {
    // Build query string from whatever params were passed, skip empty ones
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== "" && val !== undefined && val !== null) {
            query.set(key, val);
        }
    });

    const qs = query.toString();
    return apiRequest(`/events${qs ? `?${qs}` : ""}`);
}

/**
 * GET /api/events/popular
 * Top 10 events ranked by ticket sales + recency.
 *
 * @returns {Event[]}
 */
export async function getPopularEvents() {
    return apiRequest("/events/popular");
}

/**
 * GET /api/events/:id
 * Full details for a single event.
 *
 * @param {number|string} id
 * @returns {Event}
 */
export async function getEventById(id) {
    return apiRequest(`/events/${id}`);
}

/**
 * POST /api/events/:id/tickets
 * Buy a ticket. Requires DANCER role.
 *
 * @param {number|string} eventId
 */
export async function buyTicket(eventId) {
    return apiRequest(`/events/${eventId}/tickets`, {
        method: "POST",
    });
}

/**
 * GET /api/events/me/tickets
 * Get tickets for the logged in DANCER.
 */
export async function getMyTickets() {
    return apiRequest("/events/me/tickets");
}
