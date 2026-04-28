import { apiRequest } from "./client.js";

// --- Collaborations (agency perspective) ---
export async function getAgencyCollaborations() {
  return apiRequest("/agency/me/collaborations");
}

export async function acceptCollaboration(studioId) {
  return apiRequest(`/agency/me/collaborations/${studioId}/accept`, { method: "PATCH" });
}

export async function declineCollaboration(studioId) {
  return apiRequest(`/agency/me/collaborations/${studioId}`, { method: "DELETE" });
}

// --- Talent Roster ---
export async function getAgencyRoster() {
  return apiRequest("/agency/me/roster");
}

export async function addToRoster(data) {
  return apiRequest("/agency/me/roster", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeFromRoster(dancerId) {
  return apiRequest(`/agency/me/roster/${dancerId}`, { method: "DELETE" });
}

// --- CV Tags ---
export async function getTaggedCvEntries() {
  return apiRequest("/agency/me/cv-tags");
}
