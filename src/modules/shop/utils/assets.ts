import type { AvailableAsset } from "../types";

export const PUBLIC_SHOP_ASSETS_KEY = "project30tr_public_shop_assets";

export const DEFAULT_PUBLIC_SHOP_ASSETS: AvailableAsset[] = [
  { name: "Vương miện", slug: "hat_vuongmien", filename: "hat_vuongmien.png", url: "/items/hat_vuongmien.png" },
  { name: "Mặt nạ hacker", slug: "mask_matla", filename: "mask_matla.png", url: "/items/mask_matla.png" },
  { name: "Kính râm", slug: "glasses_kinh", filename: "glasses_kinh.png", url: "/items/glasses_kinh.png" },
];

/**
 * Tự động đồng bộ và lưu trữ danh sách ảnh vật phẩm từ thư mục public/items vào localStorage
 */
export async function initPublicShopAssets(): Promise<AvailableAsset[]> {
  if (typeof window === "undefined") return DEFAULT_PUBLIC_SHOP_ASSETS;

  try {
    const res = await fetch("/items/catalog.json", { cache: "no-store" });
    if (res.ok) {
      const catalog = (await res.json()) as Record<string, { name?: string; ext?: string }>;
      const catalogAssets: AvailableAsset[] = Object.entries(catalog).map(([slug, item]) => {
        const ext = item.ext || "webp";
        const filename = `${slug}.${ext}`;
        return {
          slug,
          name: item.name || slug,
          filename,
          url: `/items/${filename}`,
        };
      });

      if (catalogAssets.length > 0) {
        try {
          localStorage.setItem(PUBLIC_SHOP_ASSETS_KEY, JSON.stringify(catalogAssets));
        } catch {}
        return catalogAssets;
      }
    }
  } catch {
    // Fallback
  }

  return DEFAULT_PUBLIC_SHOP_ASSETS;
}

/**
 * Lấy danh sách ảnh vật phẩm đã lưu trong localStorage (chỉ lấy trong public/items)
 */
export function getCachedPublicShopAssets(): AvailableAsset[] {
  if (typeof window === "undefined") return DEFAULT_PUBLIC_SHOP_ASSETS;
  try {
    const raw = localStorage.getItem(PUBLIC_SHOP_ASSETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter((item: AvailableAsset) => item?.url?.startsWith("/items/"));
        if (filtered.length > 0) {
          return filtered;
        }
      }
    }
  } catch {}
  return DEFAULT_PUBLIC_SHOP_ASSETS;
}
