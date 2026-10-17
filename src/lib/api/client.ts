import axios from "axios";
import { env } from "@/config/env";

const TOKEN_COOKIE = "token"; // Token truy cập sống 3 tiếng (10800 giây)
const REFRESH_TOKEN_COOKIE = "refreshToken"; // Refresh token sống 7 ngày (604800 giây)
const USER_COOKIE = "user";

const LOCAL_STORAGE_TOKEN = "project30tr_auth_token";
const LOCAL_STORAGE_REFRESH = "project30tr_auth_refresh";
const LOCAL_STORAGE_USER = "project30tr_auth_user";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);

  // Fallback đọc từ localStorage nếu cookie bị chặn hoặc chưa sync
  if (typeof window !== "undefined") {
    try {
      if (name === TOKEN_COOKIE) return localStorage.getItem(LOCAL_STORAGE_TOKEN);
      if (name === REFRESH_TOKEN_COOKIE) return localStorage.getItem(LOCAL_STORAGE_REFRESH);
      if (name === USER_COOKIE) return localStorage.getItem(LOCAL_STORAGE_USER);
    } catch {}
  }

  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; secure" : "";
  const expiresAttr = `; expires=${new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}${expiresAttr}; samesite=lax${secureAttr}`;

  if (typeof window !== "undefined") {
    try {
      if (name === TOKEN_COOKIE) localStorage.setItem(LOCAL_STORAGE_TOKEN, value);
      if (name === REFRESH_TOKEN_COOKIE) localStorage.setItem(LOCAL_STORAGE_REFRESH, value);
      if (name === USER_COOKIE) localStorage.setItem(LOCAL_STORAGE_USER, value);
    } catch {}
  }
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; secure" : "";
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax${secureAttr}`;

  if (typeof window !== "undefined") {
    try {
      if (name === TOKEN_COOKIE) localStorage.removeItem(LOCAL_STORAGE_TOKEN);
      if (name === REFRESH_TOKEN_COOKIE) localStorage.removeItem(LOCAL_STORAGE_REFRESH);
      if (name === USER_COOKIE) localStorage.removeItem(LOCAL_STORAGE_USER);
    } catch {}
  }
}

function clearAuthCookies() {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
}

const isServer = typeof window === "undefined";
const defaultBaseUrl = isServer
  ? `${(process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:8080").replace(/\/+$/, "")}/api`
  : env.apiUrl;

const api = axios.create({
  baseURL: defaultBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    if (!config.baseURL || config.baseURL.startsWith("/")) {
      const serverBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:8080";
      config.baseURL = `${serverBase.replace(/\/+$/, "")}${config.baseURL || "/api"}`;
    }
  }

  const token =
    getCookie(TOKEN_COOKIE) ||
    (typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_TOKEN) : null);

  if (token) {
    config.headers = config.headers ?? {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Tránh vòng lặp vô tận khi gọi refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu mã lỗi 401 và chưa từng thử refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login") &&
      typeof document !== "undefined"
    ) {
      const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
      if (!refreshToken) {
        clearAuthCookies();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${env.apiUrl}/auth/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAuthData = refreshResponse.data?.data;
        if (newAuthData?.token) {
          // Token sống 3 tiếng (3 * 3600 = 10800s)
          setCookie(TOKEN_COOKIE, newAuthData.token, 10800);
          if (newAuthData.refreshToken) {
            // Refresh token sống 7 ngày (7 * 86400 = 604800s)
            setCookie(REFRESH_TOKEN_COOKIE, newAuthData.refreshToken, 604800);
          }
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newAuthData.token}`;
          processQueue(null, newAuthData.token);
          return api(originalRequest);
        } else {
          clearAuthCookies();
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        clearAuthCookies();
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && typeof document !== "undefined") {
      clearAuthCookies();
    }
    return Promise.reject(error);
  },
);

export {
  api,
  TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
  LOCAL_STORAGE_TOKEN,
  LOCAL_STORAGE_REFRESH,
  LOCAL_STORAGE_USER,
  getCookie,
  setCookie,
  deleteCookie,
  clearAuthCookies,
};
