import apiClient from "./apiClient";

export const signup = (payload) => apiClient.post("/auth/signup", payload);
export const login = (payload) => apiClient.post("/auth/login", payload);
export const resendVerification = (payload) => apiClient.post("/auth/resend-verification", payload);
export const verifyEmail = (payload) => apiClient.post("/auth/verify-email", payload);
export const forgotPassword = (payload) => apiClient.post("/auth/forgot-password", payload);
export const resetPassword = (payload) => apiClient.post("/auth/reset-password", payload);
export const refreshSession = () => apiClient.post("/auth/refresh");
export const logoutSession = () => apiClient.post("/auth/logout");
export const getMe = () => apiClient.get("/auth/me");
