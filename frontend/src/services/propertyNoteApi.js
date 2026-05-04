import apiClient from "./apiClient";

export const listPropertyNotes = (propertyId) => apiClient.get(`/properties/${propertyId}/notes`);
export const createPropertyNote = (propertyId, payload) =>
  apiClient.post(`/properties/${propertyId}/notes`, payload);
export const updatePropertyNote = (id, payload) => apiClient.patch(`/notes/${id}`, payload);
export const deletePropertyNote = (id) => apiClient.delete(`/notes/${id}`);
