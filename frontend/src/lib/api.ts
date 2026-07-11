import axios from "axios";

// Base API URL. In Next.js client-side, we proxy through /api/ which points to the backend
// In local dev, NEXT_PUBLIC_API_URL can be set to http://localhost:8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("govguide_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("govguide_token");
        // Only redirect to auth if not already there
        if (!window.location.pathname.startsWith("/auth")) {
          window.location.href = `/auth?redirect=${encodeURIComponent(
            window.location.pathname
          )}`;
        }
      }
    }
    return Promise.reject(error);
  }
);
