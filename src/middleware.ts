import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isValidCredential(val: string | undefined | null): boolean {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (
    trimmed === "" ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === "[object Object]"
  ) {
    return false;
  }
  return true;
}

function hasAuthCredentials(request: NextRequest): boolean {
  // 1. Kiểm tra qua NextRequest cookie jar
  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const user = request.cookies.get("user")?.value;

  if (isValidCredential(token) || isValidCredential(refreshToken) || isValidCredential(user)) {
    return true;
  }

  // 2. Fallback kiểm tra chuỗi header Cookie thô (phòng trường hợp Edge runtime phân tách cookie bị sót sau proxy/load balancer)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)(?:token|refreshToken|user)=([^;]+)/);
    if (match) {
      try {
        if (isValidCredential(decodeURIComponent(match[1]))) {
          return true;
        }
      } catch {
        if (isValidCredential(match[1])) {
          return true;
        }
      }
    }
  }

  // 3. Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (isValidCredential(bearer)) {
      return true;
    }
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Cho phép các file tĩnh, next internals, asset files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/models") ||
    pathname.startsWith("/items") ||
    pathname.startsWith("/lab-lessons") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/icon.png" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Với /admin, để router admin tự kiểm tra quyền và trả về 404 cho người không phải admin (giấu hoàn toàn trang admin)
  if (pathname.startsWith("/admin")) {
    const res = NextResponse.next();
    res.headers.set("x-middleware-cache", "no-cache");
    return res;
  }

  const hasAuth = hasAuthCredentials(request);

  // 3. Trang chủ ("/"), Tin tức ("/tin-tuc"), Fanpage ("/fanpage") luôn được phép truy cập
  if (
    pathname === "/" ||
    pathname.startsWith("/tin-tuc") ||
    pathname.startsWith("/fanpage")
  ) {
    const res = NextResponse.next();
    res.headers.set("x-middleware-cache", "no-cache");
    return res;
  }

  // 4. Trang đăng nhập ("/login")
  if (pathname.startsWith("/login")) {
    // Nếu đã đăng nhập mà vào lại /login thì đẩy sang nextParam hoặc /lessons
    if (hasAuth) {
      const nextParam = request.nextUrl.searchParams.get("next");
      const target =
        nextParam &&
        nextParam.startsWith("/") &&
        !nextParam.startsWith("//") &&
        nextParam !== "/"
          ? nextParam
          : "/lessons";
      const res = NextResponse.redirect(new URL(target, request.url));
      res.headers.set("x-middleware-cache", "no-cache");
      res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      return res;
    }
    const res = NextResponse.next();
    res.headers.set("x-middleware-cache", "no-cache");
    return res;
  }

  // Bỏ qua prefetch requests (Next.js Link hover/prefetch) để không làm độc hại (poison) router cache trên trình duyệt
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("x-purpose") === "prefetch" ||
    request.headers.get("next-router-prefetch") === "1";

  if (isPrefetch) {
    const res = NextResponse.next();
    res.headers.set("x-middleware-cache", "no-cache");
    return res;
  }

  // 5. Các trang tính năng trò chơi yêu cầu đăng nhập (bạn bè, profile, tủ đồ, v.v.)
  if (!hasAuth) {
    const fullPath = pathname + search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", fullPath);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set("x-middleware-cache", "no-cache");
    res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("x-middleware-cache", "no-cache");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
