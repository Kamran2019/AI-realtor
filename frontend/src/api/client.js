import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const refreshClient = axios.create({ baseURL, withCredentials: true });
const api = axios.create({ baseURL, withCredentials: true });

let accessToken =
  typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
let onSessionExpired = null;
let onSessionRefresh = null;

export function setAccessToken(token) {
  accessToken = token || null;

  if (token) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("accessToken", token);
    }
  } else {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
    }
  }
}

export function configureApiClient({ handleSessionExpired, handleSessionRefresh }) {
  onSessionExpired = handleSessionExpired;
  onSessionRefresh = handleSessionRefresh;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const { data } = await refreshClient.post("/auth/refresh");
        setAccessToken(data.accessToken);
        onSessionRefresh?.(data);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        onSessionExpired?.();
        throw refreshError;
      }
    }

    throw error;
  }
);

export default api;
