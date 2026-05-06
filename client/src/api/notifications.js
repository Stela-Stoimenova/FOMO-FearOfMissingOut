import { apiRequest } from "./client.js";

export async function getNotifications() {
  return apiRequest("/notifications");
}

export async function getUnreadCount() {
  return apiRequest("/notifications/unread-count");
}

export async function markAllRead() {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}

export async function markOneRead(id) {
  return apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
}
