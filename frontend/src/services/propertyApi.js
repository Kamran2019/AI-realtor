import apiClient from "./apiClient";

export const listProperties = (params = {}) => apiClient.get("/properties", { params });
export const getProperty = (id) => apiClient.get(`/properties/${id}`);
export const updateProperty = (id, payload) => apiClient.patch(`/properties/${id}`, payload);
