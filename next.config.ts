import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "@": "./src",
    },
  },
  sassOptions: {
    loadPaths: ["./src", "./src/styles"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async headers() {
    return [
      {
        // Ảnh đồ tên theo id, thay đổi thì đổi luôn tên file -> cache vĩnh viễn
        source: "/items/:itemId.webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // catalog.json khai báo SAU để không bị rule trên ghi đè:
        // sửa danh mục là server/client nhận ngay, không dính cache cũ
        source: "/items/catalog.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
      {
        // Model MediaPipe nặng và không đổi, cache lâu
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Thư viện MediaPipe đặt sẵn trong repo (~19MB kèm wasm), không đổi
        // theo từng lần deploy -> cache vĩnh viễn. Bài demo dùng bản này nên
        // không còn phụ thuộc CDN.
        source: "/vendor/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Bài học và SDK: sửa file là ăn ngay, không cache
        source: "/lab-lessons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/lab-sdk.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/phong",
        destination: "/lessons",
        permanent: true,
      },
      {
        source: "/phong/:roomId",
        destination: "/lessons/:roomId",
        permanent: true,
      },
      {
        source: "/phong/:roomId/:lessonId",
        destination: "/lessons/:roomId/:lessonId",
        permanent: true,
      },
      {
        source: "/lesson",
        destination: "/lessons",
        permanent: true,
      },
      {
        source: "/cong-dong",
        destination: "/tin-tuc",
        permanent: true,
      },
      {
        source: "/su-kien",
        destination: "/tin-tuc",
        permanent: true,
      },
      {
        source: "/lesson/:path*",
        destination: "/lessons/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
