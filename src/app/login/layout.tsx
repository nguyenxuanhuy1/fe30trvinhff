import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata("/login", {
    title: "Đăng nhập & Đăng ký",
    description: "Đăng nhập hoặc tạo tài khoản mới để tham gia học tập, làm thí nghiệm và nhận thưởng vật phẩm.",
  });
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
