/**
 * Nguồn cấu hình duy nhất của frontend. Chỉ đọc đúng một biến môi trường:
 *
 *   NEXT_PUBLIC_SITE_URL = domain của site, vd https://steamaze.vn
 *
 * Mọi thứ khác suy ra từ domain này, API luôn nằm ở <domain>/api
 * (vd https://steamaze.vn/api/auth/me). Không có giá trị dự phòng: thiếu biến
 * thì báo lỗi ngay khi build/khởi động thay vì âm thầm chạy với địa chỉ sai.
 *
 * Phải viết process.env.NEXT_PUBLIC_SITE_URL nguyên văn để Next thay giá trị
 * vào bundle phía trình duyệt lúc build.
 */
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

if (!rawSiteUrl) {
  throw new Error(
    "[env] Thiếu NEXT_PUBLIC_SITE_URL (domain của site, vd https://steamaze.vn). Khai báo trong file .env trước khi chạy/build.",
  );
}

const siteUrl = rawSiteUrl.replace(/\/+$/, "");
const apiUrl = `${siteUrl}/api`;

const env = {
  appName: "STEAMaze",
  siteUrl,
  apiUrl,
} as const;

export { env };
