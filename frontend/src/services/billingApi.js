import apiClient from "./apiClient";

export const createCheckout = (payload) => apiClient.post("/billing/checkout", payload);
export const createPortal = () => apiClient.post("/billing/portal", {});
