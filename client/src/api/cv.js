import { apiRequest } from "./client.js";

export async function getUserCv(userId) {
  return apiRequest(`/cv/user/${userId}`);
}

export async function createCvEntry(data) {
  return apiRequest("/cv/me", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCvEntry(entryId, data) {
  return apiRequest(`/cv/me/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCvEntry(entryId) {
  return apiRequest(`/cv/me/${entryId}`, {
    method: "DELETE",
  });
}
