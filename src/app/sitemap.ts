import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/tin-tuc`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/lessons`,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}

export default sitemap;
