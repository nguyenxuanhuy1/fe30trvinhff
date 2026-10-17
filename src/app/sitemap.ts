import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];
}

export default sitemap;
