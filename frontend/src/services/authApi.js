import apiClient from "./apiClient";

export const signup = (payload) => apiClient.post("/auth/signup", payload);
