import axios from "axios";

const baseURL =
  (typeof window !== "undefined" ? window.location.origin : "") + "/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error.config?.url ?? "";
    const isAuthRoute = url.includes("/auth/");
    const isAdminRoute = url.includes("/admin/");

    if (typeof window !== "undefined" && !isAuthRoute) {
      const shouldRedirect =
        status === 401 || (status === 403 && isAdminRoute);
      if (shouldRedirect) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const { pathname } = window.location;
        if (
          !pathname.startsWith("/login") &&
          !pathname.startsWith("/register")
        ) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export const getApiUrl = (path: string) => `${baseURL}${path}`;
