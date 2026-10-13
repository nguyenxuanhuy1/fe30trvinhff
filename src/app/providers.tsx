"use client";

import { App as AntdApp, ConfigProvider } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { createQueryClient } from "@/config/query-client";
import { AuthProvider, AuthRouteGuard } from "@/modules/auth";
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
