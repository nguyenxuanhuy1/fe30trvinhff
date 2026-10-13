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
import { TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, USER_COOKIE } from "@/lib/api/client";

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

function setCookie(name: string, value: string, maxAgeSeconds: number = 604800) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function clearAllAuthCookies() {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
  deleteCookie(USER_COOKIE);
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Bọc async để setState chỉ chạy trong callback, tránh setState đồng bộ trong effect
    async function hydrateFromCookie() {
      const storedToken = getCookie(TOKEN_COOKIE);
      const storedRefreshToken = getCookie(REFRESH_TOKEN_COOKIE);

      if (storedToken) {
        setToken(storedToken);
        try {
          const data = await getMe();
          setUser(data);
          setCookie(USER_COOKIE, JSON.stringify(data), 604800);
          setIsLoading(false);
          return;
        } catch {
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
              setCookie(USER_COOKIE, JSON.stringify(refreshed.user), 604800);
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
    setCookie(USER_COOKIE, JSON.stringify(data.user), 604800);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await registerService(payload);
    // Token sống 3 tiếng (10800s), Refresh token sống 7 ngày (604800s)
    setCookie(TOKEN_COOKIE, data.token, 10800);
    if (data.refreshToken) {
      setCookie(REFRESH_TOKEN_COOKIE, data.refreshToken, 604800);
    }
    setCookie(USER_COOKIE, JSON.stringify(data.user), 604800);
    setToken(data.token);
    setUser(data.user);
  }, []);

  // Cập nhật thông tin tài khoản và đồng bộ cookie để header đổi theo
  const updateUser = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!user) {
        throw new Error("Chưa đăng nhập");
      }
      const data = await updateProfile(user.id, payload);
      setUser(data);
      setCookie(USER_COOKIE, JSON.stringify(data), 604800);
    },
    [user],
  );

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data);
      setCookie(USER_COOKIE, JSON.stringify(data), 604800);
    } catch {
      // Ignore
    }
  }, []);

  const updateCoins = useCallback((coins: number) => {
    setUser((prev) => {
      if (!prev) return null;
      if (prev.coins === coins) return prev;
      const updated = { ...prev, coins };
      setCookie(USER_COOKIE, JSON.stringify(updated), 604800);
      return updated;
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
