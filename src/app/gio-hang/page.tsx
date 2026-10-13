import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { CartView } from "./cart-view";

export function generateMetadata(): Metadata {
  return buildMetadata("/gio-hang", {
    title: "Cửa hàng — Đổi quà tặng",
    description: "Khám phá các vật phẩm độc quyền và quà tặng đặc biệt đổi bằng xu tích lũy.",
  });
}

export default function CartPage() {
  return <CartView />;
}
