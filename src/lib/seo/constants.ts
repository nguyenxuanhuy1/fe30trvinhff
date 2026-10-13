import { env, siteConfig } from "@/config";

const SITE_URL = env.siteUrl;
const SITE_NAME = siteConfig.name;
const SITE_LANGUAGE = siteConfig.language;
const SITE_LOCALE = siteConfig.locale;
const DEFAULT_OG_IMAGE = siteConfig.ogImage;

export { DEFAULT_OG_IMAGE, SITE_LANGUAGE, SITE_LOCALE, SITE_NAME, SITE_URL };
