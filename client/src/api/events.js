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
 * GET /api/events/nearby
 * Fetch events near a specific location.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radius=10]
 * @returns {Event[]}
 */
export async function getNearbyEvents(lat, lng, radius = 10) {
    return apiRequest(`/events/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
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
 * @param {boolean} usePoints
 */
export async function buyTicket(eventId, usePoints = false) {
    return apiRequest(`/events/${eventId}/tickets`, {
        method: "POST",
        body: JSON.stringify({ usePoints }),
    });
}

/**
 * GET /api/events/me/tickets
 * Get tickets for the logged in DANCER.
 */
export async function getMyTickets() {
    return apiRequest("/events/me/tickets");
}

/**
 * POST /api/events
 * Create a new event. Requires STUDIO or AGENCY role.
 *
 * @param {object} eventData
 */
export async function createEvent(eventData) {
    return apiRequest("/events", {
        method: "POST",
        body: JSON.stringify(eventData),
    });
}

/**
 * PUT /api/events/:id
 * Update an existing event. Requires STUDIO or AGENCY role and ownership.
 *
 * @param {number|string} id
 * @param {object} eventData
 */
export async function updateEvent(id, eventData) {
    return apiRequest(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(eventData),
    });
}

/**
 * DELETE /api/events/:id
 * Delete an event. Requires STUDIO or AGENCY role and ownership.
 *
 * @param {number|string} id
 */
export async function deleteEvent(id) {
    return apiRequest(`/events/${id}`, { method: "DELETE" });
}

/**
 * POST /api/events/tickets/:id/cancel
 * Cancel a ticket. Refund tier depends on how far before the event the cancellation is made.
 */
export async function cancelTicket(ticketId) {
    return apiRequest(`/events/tickets/${ticketId}/cancel`, { method: "POST" });
}

/**
 * POST /api/events/:id/save
 * Save event to wishlist.
 */
export async function saveEvent(eventId) {
    return apiRequest(`/events/${eventId}/save`, { method: "POST" });
}

/**
 * DELETE /api/events/:id/save
 * Remove from wishlist.
 */
export async function unsaveEvent(eventId) {
    return apiRequest(`/events/${eventId}/save`, { method: "DELETE" });
}

/**
 * GET /api/events/me/saved
 * Get own wishlist.
 */
export async function getSavedEvents() {
    return apiRequest("/events/me/saved");
}

/**
 * GET /api/events/:id/saved
 * Check if a single event is in the dancer's wishlist.
 */
export async function isEventSaved(eventId) {
    return apiRequest(`/events/${eventId}/saved`);
}

/**
 * GET /api/events?creatorId=X&limit=100
 * Fetch all events created by a specific user (studio/agency dashboard).
 */
export async function getEventsByCreator(creatorId) {
    return apiRequest(`/events?creatorId=${creatorId}&limit=100`);
}

/**
 * POST /api/payments/intent
 * Create a Stripe PaymentIntent (or simulated mode) before buying a ticket.
 */
export async function createPaymentIntent(eventId, usePoints, paymentMethodId = null) {
    return apiRequest("/payments/intent", {
        method: "POST",
        body: JSON.stringify({ eventId, usePoints, paymentMethodId }),
    });
}

/**
 * POST /api/events/:id/tickets
 * Finalize ticket purchase.
 *
 * @param {string} eventId
 * @param {boolean} usePoints
 * @param {object} paymentData - { paymentIntentId, simulated, ... }
 */
export async function buyTicketWithPayment(eventId, usePoints, paymentData) {
    return apiRequest(`/events/${eventId}/tickets`, {
        method: "POST",
        body: JSON.stringify({ usePoints, ...paymentData }),
    });
}

/**
 * GET /api/events/:id/suggested-dancers
 * Suggest dancers matching the event's dance styles (STUDIO/AGENCY only).
 */
export async function getSuggestedDancers(eventId) {
    return apiRequest(`/events/${eventId}/suggested-dancers`);
}

/**
 * GET /api/users/search — search studios, agencies, and dancers for event invitations.
 */
export async function searchAllForInvite(q) {
    const [studios, agencies, dancers] = await Promise.all([
        apiRequest(`/users/search?role=STUDIO${q ? `&query=${encodeURIComponent(q)}` : ""}`),
        apiRequest(`/users/search?role=AGENCY${q ? `&query=${encodeURIComponent(q)}` : ""}`),
        apiRequest(`/users/search?role=DANCER${q ? `&query=${encodeURIComponent(q)}` : ""}`),
    ]);
    const combined = [
        ...(Array.isArray(studios) ? studios : []),
        ...(Array.isArray(agencies) ? agencies : []),
        ...(Array.isArray(dancers) ? dancers : []),
    ];
    return combined.filter((u, i, arr) => arr.findIndex(x => x.id === u.id) === i);
}

/**
 * POST /api/events/:id/invite — invite a user (dancer/studio/agency) to the event.
 * Creates a notification with a link to the event so the invitee can preview before accepting.
 */
export async function inviteEventParticipant(eventId, receiverId) {
    return apiRequest(`/events/${eventId}/invite`, {
        method: "POST",
        body: JSON.stringify({ receiverId }),
    });
}

