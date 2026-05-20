import apiClient from "./apiClient";

export const exportPropertiesCsv = (params = {}) =>
  apiClient.get("/properties/export.csv", {
    params,
    responseType: "blob"
  });

export const generatePropertyReport = (propertyId) =>
  apiClient.post(`/reports/property/${propertyId}`);

export const listReports = () => apiClient.get("/reports");

export const getReport = (id) => apiClient.get(`/reports/${id}`);

export const downloadReport = (id) =>
  apiClient.get(`/reports/${id}/download`, {
    responseType: "blob"
  });
