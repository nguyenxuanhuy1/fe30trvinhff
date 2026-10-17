import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Chặn công cụ tìm kiếm cào các trang nội bộ/tài khoản/admin
        disallow: [
          "/admin",
          "/inventory",
          "/gio-hang",
          "/profile",
          "/ban-be",
          "/login",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

export default robots;
