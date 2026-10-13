"use client";

import { useQuery } from "@tanstack/react-query";
import { SLOT_DEFAULTS, slotFromSlug } from "../item-slots";
import { slotOrder } from "../inventory.const";
import type { CatalogItem, CatalogRawItem } from "../types";

/**
 * Danh mục đồ nằm ở public/items/catalog.json, không đổi theo tài khoản nên
 * staleTime: Infinity, chỉ tải 1 lần rồi dùng lại.
 *
 * Slot không khai báo trong file mà suy ra từ tiền tố tên ảnh ("hat_circle" ->
 * "hat"), vị trí gắn lấy theo SLOT_DEFAULTS. Cùng quy tắc với
 * backend/src/config/itemSlots.js nên server và client luôn hiểu giống nhau.
 */
function useCatalog() {
  const query = useQuery({
    queryKey: ["catalog"],
    queryFn: async (): Promise<CatalogItem[]> => {
      const res = await fetch("/items/catalog.json", { cache: "no-cache" });
      if (!res.ok) {
        throw new Error(`Không tải được catalog.json (${res.status})`);
      }

      const raw = (await res.json()) as Record<string, CatalogRawItem>;

      return Object.entries(raw)
        .map(([id, meta]): CatalogItem | null => {
          const slot = slotFromSlug(id);

          if (!slot) {
            // Món có tiền tố lạ thì bỏ qua thay vì hiển thị sai vị trí
            return null;
          }

          const defaults = SLOT_DEFAULTS[slot];

          return {
            id,
            name: meta.name,
            slot,
            anchor: defaults.anchor,
            scale: meta.scale ?? defaults.scale,
            offsetX: meta.offsetX ?? defaults.offsetX,
            offsetY: meta.offsetY ?? defaults.offsetY,
            imageUrl: meta.ext ? `/items/${id}.${meta.ext}` : `/items/${id}.webp`,
            unlockedBy: meta.unlockedBy,
          };
        })
        .filter((item): item is CatalogItem => item !== null)
        .sort((a, b) => {
          const bySlot = slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot);
          return bySlot !== 0 ? bySlot : a.id.localeCompare(b.id);
        });
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  return query;
}

export { useCatalog };
