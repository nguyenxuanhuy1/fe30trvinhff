import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Khu vực quản trị không để công cụ tìm kiếm vào
        disallow: ["/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

export default robots;
