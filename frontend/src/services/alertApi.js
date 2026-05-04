import apiClient from "./apiClient";

export const listAlertRules = () => apiClient.get("/alerts");
export const createAlertRule = (payload) => apiClient.post("/alerts", payload);
export const updateAlertRule = (id, payload) => apiClient.patch(`/alerts/${id}`, payload);
export const deleteAlertRule = (id) => apiClient.delete(`/alerts/${id}`);
