import { cache } from "react";
import { cookies } from "next/headers";
import { isAxiosError } from "axios";
import { getMe, refreshAuth } from "../services/auth.service";
import type { User } from "../types";

// Tên cookie phải khai báo lại ở đây vì hằng số trong AuthContext nằm trong
// module "use client", không import vào phía server được
const TOKEN_COOKIE = "token";
const REFRESH_TOKEN_COOKIE = "refreshToken";

type AdminSession =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "granted"; user: User };

function isUnauthorized(err: unknown) {
  return isAxiosError(err) && err.response?.status === 401;
}

/**
 * Lấy user hiện tại từ backend. Token truy cập chỉ sống 3 tiếng (cookie cũng
 * hết hạn cùng lúc), nên khi thiếu hoặc hết hạn thì thử dùng refreshToken để
 * lấy user. Không ghi lại cookie được trong server component, phía trình
 * duyệt sẽ tự làm mới cookie ở lần gọi API kế tiếp.
 */
async function resolveUser(token?: string, refreshToken?: string): Promise<User | null> {
  if (token) {
    try {
      return await getMe(token);
    } catch (err) {
      if (!isUnauthorized(err)) {
        console.error("[admin-session] Không gọi được /auth/me:", err);
        return null;
      }
    }
  }

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshed = await refreshAuth(refreshToken);
    return refreshed.token ? await getMe(refreshed.token) : refreshed.user;
  } catch (err) {
    if (!isUnauthorized(err)) {
      console.error("[admin-session] Không làm mới được phiên:", err);
    }
    return null;
  }
}

/**
 * Chặn /admin ở phía server: đọc cookie token rồi hỏi lại backend xem token có
 * hợp lệ và tài khoản có đúng role ADMIN không. Không tin cookie vì cookie
 * không phải httpOnly, người dùng tự sửa được, nên role phải lấy từ DB.
 */
const getAdminSession = cache(async function getAdminSession(): Promise<AdminSession> {
  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_TOKEN_COOKIE)?.value;

  const user = await resolveUser(token, refreshToken);
  if (!user) {
    return { status: "unauthenticated" };
  }

  if (user.role !== "ADMIN") {
    return { status: "forbidden" };
  }

  return { status: "granted", user };
});

export { getAdminSession };
export type { AdminSession };
