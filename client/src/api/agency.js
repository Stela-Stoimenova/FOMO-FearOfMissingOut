import { apiRequest } from "./client.js";

// --- Collaborations (agency perspective) ---
export async function getAgencyCollaborations() {
  return apiRequest("/agency/me/collaborations");
}

export async function sendCollabInviteToStudio(data) {
  return apiRequest("/agency/me/collaborations", {
    method: "POST",
    body: JSON.stringify(data),
  });
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

// --- Public agency profile (no auth) ---
export async function getPublicAgencyRoster(id) {
  return apiRequest(`/agency/${id}/roster`);
}
export async function getPublicAgencyCollaborations(id) {
  return apiRequest(`/agency/${id}/collaborations`);
}
export async function getPublicAgencyCvTags(id) {
  return apiRequest(`/agency/${id}/cv-tags`);
}

// --- CV Tags ---
export async function getTaggedCvEntries() {
  return apiRequest("/agency/me/cv-tags");
}

export async function acceptCvTag(cvId) {
  return apiRequest(`/agency/me/cv-tags/${cvId}/accept`, { method: "PATCH" });
}

export async function declineCvTag(cvId) {
  return apiRequest(`/agency/me/cv-tags/${cvId}`, { method: "DELETE" });
}
