"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  getMe,
  login as loginService,
  register as registerService,
  updateProfile,
  refreshAuth,
} from "@/modules/auth/services/auth.service";
import type { LoginPayload, RegisterPayload, UpdateProfilePayload, User } from "@/modules/auth/types";
import {
  TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
  LOCAL_STORAGE_TOKEN,
  LOCAL_STORAGE_REFRESH,
  LOCAL_STORAGE_USER,
  getCookie,
  setCookie,
  deleteCookie,
  clearAuthCookies as clearAllAuthCookies,
} from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateUser: (payload: UpdateProfilePayload) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateCoins: (coins: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER) || getCookie(USER_COOKIE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitialToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return getCookie(TOKEN_COOKIE) || localStorage.getItem(LOCAL_STORAGE_TOKEN) || null;
  } catch {
    return null;
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    // Nếu đã có token và user trong localStorage/cookie, cho phép truy cập ngay
    const initialToken = getInitialToken();
    const initialUser = getInitialUser();
    return !(initialToken && initialUser);
  });

  useEffect(() => {
    async function hydrateFromCookie() {
      const storedToken = getCookie(TOKEN_COOKIE);
      const storedRefreshToken = getCookie(REFRESH_TOKEN_COOKIE);

      if (storedToken) {
        setToken(storedToken);
        try {
          const data = await getMe();
          setUser(data);
          try {
            setCookie(USER_COOKIE, JSON.stringify(data), 10800);
          } catch {}
          setIsLoading(false);
          return;
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          // Nếu không phải lỗi xác thực (ví dụ lỗi mạng tạm thời), giữ nguyên phiên làm việc đã lưu
          if (status !== 401 && status !== 403) {
            setIsLoading(false);
            return;
          }
          // Token 3 tiếng có thể đã hết hạn, thử refresh bằng refresh token 7 ngày
        }
      }

      // Thử dùng refresh token nếu access token không còn hoặc hết hạn
      if (storedRefreshToken) {
        try {
          const refreshed = await refreshAuth(storedRefreshToken);
          if (refreshed?.token) {
            setToken(refreshed.token);
            setCookie(TOKEN_COOKIE, refreshed.token, 10800); // 3 tiếng
            if (refreshed.refreshToken) {
              setCookie(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, 604800); // 7 ngày
            }
            if (refreshed.user) {
              setUser(refreshed.user);
              try {
                setCookie(USER_COOKIE, JSON.stringify(refreshed.user), 10800);
              } catch {}
            }
            setIsLoading(false);
            return;
          }
        } catch {
          clearAllAuthCookies();
        }
      }

      clearAllAuthCookies();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }

    void hydrateFromCookie();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await loginService(payload);
    // Token sống 3 tiếng (10800s), Refresh token sống 7 ngày (604800s)
    setCookie(TOKEN_COOKIE, data.token, 10800);
    if (data.refreshToken) {
      setCookie(REFRESH_TOKEN_COOKIE, data.refreshToken, 604800);
    }
    if (data.user) {
      try {
        setCookie(USER_COOKIE, JSON.stringify(data.user), 10800);
      } catch {}
    }
    setToken(data.token);
    setUser(data.user);
    setIsLoading(false);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await registerService(payload);
    // Token sống 3 tiếng (10800s), Refresh token sống 7 ngày (604800s)
    setCookie(TOKEN_COOKIE, data.token, 10800);
    if (data.refreshToken) {
      setCookie(REFRESH_TOKEN_COOKIE, data.refreshToken, 604800);
    }
    if (data.user) {
      try {
        setCookie(USER_COOKIE, JSON.stringify(data.user), 10800);
      } catch {}
    }
    setToken(data.token);
    setUser(data.user);
    setIsLoading(false);
  }, []);

  // Cập nhật thông tin tài khoản
  const updateUser = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!user) {
        throw new Error("Chưa đăng nhập");
      }
      const data = await updateProfile(user.id, payload);
      setUser(data);
    },
    [user],
  );

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data);
    } catch {
      // Ignore
    }
  }, []);

  const updateCoins = useCallback((coins: number) => {
    setUser((prev) => {
      if (!prev) return null;
      if (prev.coins === coins) return prev;
      return { ...prev, coins };
    });
  }, []);

  const logout = useCallback(() => {
    clearAllAuthCookies();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      updateUser,
      refreshUser,
      updateCoins,
      logout,
    }),
    [user, token, isLoading, login, register, updateUser, refreshUser, updateCoins, logout],
  );


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải dùng bên trong AuthProvider");
  }
  return ctx;
}

export { AuthProvider, useAuth, TOKEN_COOKIE, USER_COOKIE };
