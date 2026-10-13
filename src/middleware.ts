import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Với /admin, để router admin tự kiểm tra quyền và trả về 404 cho người không phải admin (giấu hoàn toàn trang admin)
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasAuth = Boolean(token || refreshToken);

  // 3. Quy tắc điều hướng trang chủ ("/"):
  // Thống nhất trang chủ chỉ là landing page.
  // Khi mới vào trang ("/"):
  // - Người dùng đã đăng nhập thì luôn đẩy sang /lessons.
  // - Chưa đăng nhập cũng đẩy vào /lessons khi mới vào trang.
  // - Khi người dùng chủ động bấm Quay lại từ /lessons về landing page (/?landing=true), cho phép xem landing page.
  if (pathname === "/") {
    if (request.nextUrl.searchParams.get("landing") === "true") {
      return NextResponse.next();
    }
    const lessonsUrl = new URL("/lessons", request.url);
    return NextResponse.redirect(lessonsUrl);
  }

  // 4. Các trang công khai: login, tin-tuc, fanpage, danh sách cấp độ học /lessons
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/tin-tuc") ||
    pathname.startsWith("/fanpage") ||
    pathname === "/lessons" ||
    pathname.startsWith("/lessons/")
  ) {
    // Nếu đã đăng nhập mà vào lại /login thì đẩy về /lessons
    if (pathname.startsWith("/login") && hasAuth) {
      return NextResponse.redirect(new URL("/lessons", request.url));
    }
    return NextResponse.next();
  }

  // 5. Các trang tính năng trò chơi yêu cầu đăng nhập (bạn bè, profile, giỏ hàng, v.v.)
  if (!hasAuth) {
    const fullPath = pathname + search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
