import { siteConfig } from "@/config";
import { SITE_LANGUAGE, SITE_NAME, SITE_URL } from "./constants";

interface BreadcrumbEntry {
  name: string;
  path: string;
}

function buildOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: SITE_LANGUAGE,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/background.webp`,
    },
    sameAs: siteConfig.socialLinks.map((link) => link.url),
  };
}

function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

function buildBreadcrumbList(entries: readonly BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: `${SITE_URL}${entry.path}`,
    })),
  };
}

function buildWebApplication() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: SITE_LANGUAGE,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    description: siteConfig.seoText.home.description,
    browserRequirements: "Requires modern browser with WebGL & MediaPipe support",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
    },
    author: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export { buildBreadcrumbList, buildOrganization, buildWebApplication, buildWebSite };
export type { BreadcrumbEntry };
