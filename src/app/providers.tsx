"use client";

import { App as AntdApp, ConfigProvider } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { createQueryClient } from "@/config/query-client";
import { AuthProvider, AuthRouteGuard } from "@/modules/auth";
import { initPublicShopAssets } from "@/modules/shop/utils/assets";
import dynamic from "next/dynamic";

import { GameToastContainer } from "@/components/ui/game-toast";

const AILoadingOverlay = dynamic(
  () => import("@/modules/inventory/components/AILoadingOverlay").then((mod) => mod.default),
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
}

function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    // 1. Khi người dùng vừa vào web, lưu luôn các ảnh ở public vào localStorage để tái sử dụng
    void initPublicShopAssets();

    // 2. Bỏ chức năng full màn hình F11 mặc định của trình duyệt
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11" || e.keyCode === 122) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AuthRouteGuard>
              {children}
            </AuthRouteGuard>
            <AILoadingOverlay />
            <GameToastContainer />
          </QueryClientProvider>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export { Providers };
export type { ProvidersProps };
