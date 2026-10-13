import { cookies } from "next/headers";
import { getMe } from "../services/auth.service";
import type { User } from "../types";

// Tên cookie phải khai báo lại ở đây vì hằng số trong AuthContext nằm trong
// module "use client", không import vào phía server được
const TOKEN_COOKIE = "token";

type AdminSession =
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "granted"; user: User };

/**
 * Chặn /admin ở phía server: đọc cookie token rồi hỏi lại backend xem token có
 * hợp lệ và tài khoản có đúng role ADMIN không. Không tin cookie vì cookie
 * không phải httpOnly, người dùng tự sửa được, nên role phải lấy từ DB.
 */
import { cache } from "react";

const getAdminSession = cache(async function getAdminSession(): Promise<AdminSession> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) {
    return { status: "unauthenticated" };
  }

  let user: User;
  try {
    user = await getMe(token);
  } catch {
    return { status: "unauthenticated" };
  }

  if (user.role !== "ADMIN") {
    return { status: "forbidden" };
  }

  return { status: "granted", user };
});

export { getAdminSession };
export type { AdminSession };
