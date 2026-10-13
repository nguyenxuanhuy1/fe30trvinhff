"use client";

import { useEffect } from "react";
import { useEquipStore } from "@/stores/equip-store";

/**
 * Cho trình duyệt tải trước ảnh của các món đang mặc để khi bấm "Vào thí nghiệm"
 * thì ảnh đã nằm trong HTTP cache, bài học mở ra không bị trễ ảnh.
 *
 * new Image().src chỉ tải, không render. Lỗi tải ảnh không được làm hỏng trang.
 */
function useItemPreload(ids: string[]): void {
  const key = ids.join(",");

  useEffect(() => {
    if (ids.length === 0) {
      return;
    }

    for (const id of ids) {
      const image = new Image();
      image.decoding = "async";
      image.src = `/items/${id}.webp`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** Đồ đang mặc trong store (đã hydrate từ localStorage hoặc từ server) */
function useEquippedItems<T>(allItems: T[]): { equippedItems: T[]; equipped: string[] } {
  const equipped = useEquipStore((state) => state.equipped);

  const equippedItems = equipped.reduce<T[]>((acc, id) => {
    const found = allItems.find((item) => (item as { id: string }).id === id);
    if (found) {
      acc.push(found);
    }
    return acc;
  }, []);

  return { equippedItems, equipped };
}

export { useItemPreload, useEquippedItems };
