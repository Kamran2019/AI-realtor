import apiClient from "./apiClient";

export const listUsers = (params = {}) => apiClient.get("/users", { params });
export const getUser = (id) => apiClient.get(`/users/${id}`);
export const createUser = (payload) => apiClient.post("/users", payload);
export const updateUser = (id, payload) => apiClient.patch(`/users/${id}`, payload);
export const updateUserStatus = (id, payload) => apiClient.patch(`/users/${id}/status`, payload);
