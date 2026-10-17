const isServer = typeof window === "undefined";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const rawBackendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8080";

const env = {
  apiUrl: isServer
    ? `${(process.env.BACKEND_URL || rawSiteUrl).replace(/\/+$/, "")}/api`
    : (process.env.NEXT_PUBLIC_API_URL || "/api"),
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Frontend App",
  siteUrl: rawSiteUrl.replace(/\/+$/, ""),
} as const;

export { env };

