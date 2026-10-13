"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

import { LoadingState } from "@/components/ui";

interface AuthRouteGuardProps {
  children: ReactNode;
}

export function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const { user, token, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/lessons") ||
    pathname.startsWith("/tin-tuc") ||
    pathname.startsWith("/fanpage");

  useEffect(() => {
    if (!isLoading && !token && !user && !isPublic) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      router.replace(`/login?next=${encodeURIComponent(pathname + search)}`);
    }
  }, [isLoading, token, user, isPublic, pathname, router]);

  if (!isPublic && (isLoading || (!token && !user))) {
    return <LoadingState />;
  }

  return <>{children}</>;
}
