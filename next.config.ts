import type { NextConfig } from "next";
import { env } from "./src/config/env";

const site = new URL(env.siteUrl);

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
    // Chỉ tối ưu ảnh của chính domain. Trước đây cho phép mọi domain https ("**"),
    // ai cũng dùng được /_next/image của site làm máy tải + nén ảnh miễn phí từ bất kỳ đâu.
    // Ảnh từ link ngoài (ảnh bìa bài viết, ảnh đại diện...) đều đã dùng `unoptimized`.
    remotePatterns: [
      {
        // Ảnh do chính domain phục vụ (dev chạy http://localhost cũng khớp)
        protocol: site.protocol.replace(":", "") as "http" | "https",
        hostname: site.hostname,
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
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        // Ảnh đồ trang bị thực tế là .png (rule .webp ở trên không khớp nên trước đây
        // trình duyệt phải hỏi lại máy chủ mỗi lần). Không dùng immutable vì ảnh có thể
        // bị thay cùng tên: lưu 7 ngày, hết hạn vẫn dùng bản cũ trong lúc tải bản mới ngầm.
        source: "/items/:itemId.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
      {
        // Ảnh giao diện (ảnh nền, hoa văn, ảnh chuột...): trước đây max-age=0 nên mỗi lần
        // vào trang đều hỏi lại máy chủ. Lưu 7 ngày, cập nhật ngầm khi có ảnh mới.
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
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
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
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
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
