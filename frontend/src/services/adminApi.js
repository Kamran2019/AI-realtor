import apiClient from "./apiClient";

export const getAdminDashboard = () => apiClient.get("/admin/dashboard");

export const listAuditLogs = (params = {}) =>
  apiClient.get("/admin/audit-logs", {
    params
  });
