import apiClient from "./apiClient";

export const listBookmarks = () => apiClient.get("/bookmarks");
export const toggleBookmark = (propertyId) => apiClient.post(`/bookmarks/${propertyId}/toggle`);
