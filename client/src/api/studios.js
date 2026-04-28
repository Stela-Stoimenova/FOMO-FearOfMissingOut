import { apiRequest } from "./client.js";

// --- Weekly Classes ---
export async function getStudioClasses(studioId) {
  return apiRequest(`/studios/${studioId}/classes`);
}

export async function createStudioClass(data) {
  return apiRequest("/studios/me/classes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStudioClass(classId, data) {
  return apiRequest(`/studios/me/classes/${classId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteStudioClass(classId) {
  return apiRequest(`/studios/me/classes/${classId}`, {
    method: "DELETE",
  });
}

// --- Memberships ---
export async function getStudioMemberships(studioId) {
  return apiRequest(`/studios/${studioId}/memberships`);
}

export async function createMembershipTier(data) {
  return apiRequest("/studios/me/memberships", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMembershipTier(tierId, data) {
  return apiRequest(`/studios/me/memberships/${tierId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMembershipTier(tierId) {
  return apiRequest(`/studios/me/memberships/${tierId}`, {
    method: "DELETE",
  });
}

export async function purchaseMembership(tierId) {
  return apiRequest(`/studios/memberships/${tierId}/purchase`, {
    method: "POST",
  });
}

// DANCER: get own purchased memberships
export async function getMyPurchasedMemberships() {
  return apiRequest("/studios/me/memberships/purchased");
}

// STUDIO: get all own tiers including inactive (for management)
export async function getOwnMembershipsManage() {
  return apiRequest("/studios/me/memberships-manage");
}

// --- Team ---
export async function getStudioTeam(studioId) {
  return apiRequest(`/studios/${studioId}/team`);
}

export async function addStudioTeamMember(data) {
  return apiRequest("/studios/me/team", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteStudioTeamMember(teamId) {
  return apiRequest(`/studios/me/team/${teamId}`, {
    method: "DELETE",
  });
}

// --- Collaborations ---
export async function getStudioCollaborations(studioId) {
  return apiRequest(`/studios/${studioId}/collaborations`);
}

export async function createCollaboration(data) {
  return apiRequest("/studios/me/collaborations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCollaboration(agencyId) {
  return apiRequest(`/studios/me/collaborations/${agencyId}`, {
    method: "DELETE",
  });
}
