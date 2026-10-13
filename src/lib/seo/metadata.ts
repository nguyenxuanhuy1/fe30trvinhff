import type { Metadata } from "next";
import { siteConfig, type PageSeoText } from "@/config";
import { DEFAULT_OG_IMAGE, SITE_LOCALE, SITE_URL } from "./constants";

function buildMetadata(path: string, seo: PageSeoText): Metadata {
  const canonical = `${SITE_URL}${path}`;
  const { title, description, keywords, noIndex, noFollow } = seo;

  return {
    title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: { canonical },
    robots:
      noIndex || noFollow
        ? { index: !noIndex, follow: !noFollow }
        : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: siteConfig.name,
      locale: SITE_LOCALE,
      title,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE.path,
          width: DEFAULT_OG_IMAGE.width,
          height: DEFAULT_OG_IMAGE.height,
          alt: DEFAULT_OG_IMAGE.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.path],
    },
  };
}

export { buildMetadata };
