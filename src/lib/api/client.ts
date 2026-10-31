import axios from "axios";
import { env } from "@/config/env";
import { useEquipStore } from "@/stores/equip-store";
import { useRetroEquipStore } from "@/stores/retro-equip-store";

const TOKEN_COOKIE = "token"; // Token truy cập sống 3 tiếng (10800 giây)
const REFRESH_TOKEN_COOKIE = "refreshToken"; // Refresh token sống 7 ngày (604800 giây)
const USER_COOKIE = "user";

const STORAGE_VERSION = "v2";
const STORAGE_VERSION_KEY = "project30tr_storage_version";

const LOCAL_STORAGE_TOKEN = `project30tr_auth_token_${STORAGE_VERSION}`;
const LOCAL_STORAGE_REFRESH = `project30tr_auth_refresh_${STORAGE_VERSION}`;
const LOCAL_STORAGE_USER = `project30tr_auth_user_${STORAGE_VERSION}`;

// Danh sách các key cũ phiên bản v1 cần dọn dẹp tự động
const LEGACY_STORAGE_KEYS = [
  "project30tr_auth_token",
  "project30tr_auth_refresh",
  "project30tr_auth_user",
];

/**
 * Tự động di chuyển / dọn dẹp key lưu trữ cũ khi đổi phiên bản
 * Tránh lỗi 500/loop do cookie hoặc localStorage cũ để lại
 */
function runStorageMigration() {
  if (typeof window === "undefined") return;
  try {
    const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (currentVersion !== STORAGE_VERSION) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(legacyKey);
      }
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
    }
  } catch {}
}

if (typeof window !== "undefined") {
  runStorageMigration();
}

/**
 * Làm sạch chuỗi token, loại bỏ các giá trị "undefined", "null", "[object Object]"
 */
function sanitizeToken(token: unknown): string | null {
  if (!token || typeof token !== "string") return null;
  const trimmed = token.trim();
  if (
    trimmed === "" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === "[object Object]"
  ) {
    return null;
  }
  return trimmed;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (match) {
    try {
      const decoded = decodeURIComponent(match[1]);
      const clean = sanitizeToken(decoded);
      if (clean) return clean;
      // Nếu giá trị trong cookie bị hỏng ("undefined", "null"), xóa ngay lập tức
      deleteCookie(name);
    } catch {
      deleteCookie(name);
    }
  }

  // Fallback đọc từ localStorage nếu cookie chưa đồng bộ
  if (typeof window !== "undefined") {
    try {
      let raw: string | null = null;
      if (name === TOKEN_COOKIE) raw = localStorage.getItem(LOCAL_STORAGE_TOKEN);
      if (name === REFRESH_TOKEN_COOKIE) raw = localStorage.getItem(LOCAL_STORAGE_REFRESH);
      if (name === USER_COOKIE) raw = localStorage.getItem(LOCAL_STORAGE_USER);

      const clean = sanitizeToken(raw);
      if (clean) return clean;

      // Xoá chuỗi rác khỏi localStorage nếu có
      if (raw) {
        if (name === TOKEN_COOKIE) localStorage.removeItem(LOCAL_STORAGE_TOKEN);
        if (name === REFRESH_TOKEN_COOKIE) localStorage.removeItem(LOCAL_STORAGE_REFRESH);
        if (name === USER_COOKIE) localStorage.removeItem(LOCAL_STORAGE_USER);
      }
    } catch {}
  }

  return null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const cleanVal = sanitizeToken(value);
  if (!cleanVal) {
    deleteCookie(name);
    return;
  }

  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; secure" : "";
  const expiresAttr = `; expires=${new Date(Date.now() + maxAgeSeconds * 1000).toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(cleanVal)}; path=/; max-age=${maxAgeSeconds}${expiresAttr}; samesite=lax${secureAttr}`;

  if (typeof window !== "undefined") {
    try {
      if (name === TOKEN_COOKIE) localStorage.setItem(LOCAL_STORAGE_TOKEN, cleanVal);
      if (name === REFRESH_TOKEN_COOKIE) localStorage.setItem(LOCAL_STORAGE_REFRESH, cleanVal);
      if (name === USER_COOKIE) localStorage.setItem(LOCAL_STORAGE_USER, cleanVal);
    } catch {}
  }
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; secure" : "";
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

  // Xóa triệt để cho mọi biến thể path và samesite
  document.cookie = `${name}=; path=/; max-age=0; ${expired}; samesite=lax${secureAttr}`;
  document.cookie = `${name}=; path=/; max-age=0; ${expired}${secureAttr}`;
  document.cookie = `${name}=; max-age=0; ${expired}`;

  if (typeof window !== "undefined") {
    try {
      if (name === TOKEN_COOKIE) localStorage.removeItem(LOCAL_STORAGE_TOKEN);
      if (name === REFRESH_TOKEN_COOKIE) localStorage.removeItem(LOCAL_STORAGE_REFRESH);
      if (name === USER_COOKIE) localStorage.removeItem(LOCAL_STORAGE_USER);
    } catch {}
  }
}

/**
 * Xóa sạch toàn bộ phiên đăng nhập ở Cookie, localStorage, Zustand Stores
 */
function clearAuthCookies() {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);

  // Xoá cả các cookie/storage phiên bản cũ nếu còn sót
  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(legacyKey);
      } catch {}
    }
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LOCAL_STORAGE_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_REFRESH);
      localStorage.removeItem(LOCAL_STORAGE_USER);

      // Xoá state Zustand
      useEquipStore.getState().clear();
      useRetroEquipStore.getState().reset();

      // Thông báo cho AuthContext cập nhật state React
      window.dispatchEvent(new CustomEvent("auth:logout"));
    } catch {}
  }
}

/**
 * Xử lý khi nhận mã lỗi 401: Xoá phiên và chuyển hướng về trang /login
 */
function handleUnauthorizedAndRedirect() {
  clearAuthCookies();
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (!pathname.startsWith("/login")) {
      const nextParam = encodeURIComponent(pathname + window.location.search);
      window.location.href = `/login?next=${nextParam}`;
    }
  }
}

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    getCookie(TOKEN_COOKIE) ||
    (typeof window !== "undefined" ? sanitizeToken(localStorage.getItem(LOCAL_STORAGE_TOKEN)) : null);

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
        handleUnauthorizedAndRedirect();
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
          handleUnauthorizedAndRedirect();
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        handleUnauthorizedAndRedirect();
        processQueue(refreshErr, null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401 && typeof document !== "undefined") {
      handleUnauthorizedAndRedirect();
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
  STORAGE_VERSION,
  sanitizeToken,
  getCookie,
  setCookie,
  deleteCookie,
  clearAuthCookies,
  handleUnauthorizedAndRedirect,
};
