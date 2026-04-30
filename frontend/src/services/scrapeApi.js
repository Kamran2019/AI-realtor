import apiClient from "./apiClient";

export const listScrapeSources = (params = {}) => apiClient.get("/scrape/sources", { params });
export const createScrapeSource = (payload) => apiClient.post("/scrape/sources", payload);
export const updateScrapeSource = (id, payload) => apiClient.patch(`/scrape/sources/${id}`, payload);
export const updateScrapeSourceStatus = (id, payload) =>
  apiClient.patch(`/scrape/sources/${id}/status`, payload);
export const runScrapeSource = (id) => apiClient.post(`/scrape/sources/${id}/run`);
export const listScrapeRuns = (params = {}) => apiClient.get("/scrape/runs", { params });
