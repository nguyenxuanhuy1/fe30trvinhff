const isServer = typeof window === "undefined";
const internalApiUrl = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8080";

const env = {
  apiUrl: isServer
    ? `${internalApiUrl.replace(/\/+$/, "")}/api`
    : (process.env.NEXT_PUBLIC_API_URL ?? "/api"),
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Frontend App",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  ),
} as const;

export { env };
