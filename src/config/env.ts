const isServer = typeof window === "undefined";

// Backend luôn chạy cùng máy, chỉ nghe trên 127.0.0.1
const BACKEND_ORIGIN = "http://127.0.0.1:8080";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const env = {
  // Server gọi thẳng backend, trình duyệt gọi qua proxy /api của Next
  apiUrl: isServer ? `${BACKEND_ORIGIN}/api` : "/api",
  appName: "STEAMaze",
  siteUrl: rawSiteUrl.replace(/\/+$/, ""),
} as const;

export { env, BACKEND_ORIGIN };
