// src/api/messages.js
import { apiRequest } from "./client.js";

/**
 * POST /api/messages
 * Send a message to a user.
 */
export async function sendMessage(receiverId, content) {
    return apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({ receiverId, content }),
    });
}

/**
 * GET /api/messages
 * Get inbox (received messages).
 */
export async function getInbox() {
    return apiRequest("/messages");
}

/**
 * GET /api/messages/sent
 * Get sent messages.
 */
export async function getSentMessages() {
    return apiRequest("/messages/sent");
}

/**
 * PUT /api/messages/:id/read
 * Mark a message as read.
 */
export async function markMessageRead(id) {
    return apiRequest(`/messages/${id}/read`, {
        method: "PUT",
    });
}

/**
 * GET /api/messages/conversations
 * Get grouped conversation list.
 */
export async function getConversations() {
    return apiRequest("/messages/conversations");
}

/**
 * GET /api/messages/thread/:userId
 * Get the full thread with a specific user.
 */
export async function getThread(userId) {
    return apiRequest(`/messages/thread/${userId}`);
}
