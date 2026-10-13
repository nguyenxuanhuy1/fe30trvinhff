// Quy ước chung cho đồ trang bị. Bản sao của backend/src/config/itemSlots.js —
// hai bên phải giống nhau vì slot suy ra từ tên ảnh chứ không khai báo tay.
//
// Khi đổi ở một bên thì phải đổi cả bên kia, có test chốt lại (tests/catalog.test.ts).

import type { ItemAnchor, ItemSlot } from "./types";

interface SlotDefault {
  label: string;
  anchor: ItemAnchor;
  /** vị trí vùng gắn, % chiều cao khung người */
  top: number;
  scale: number;
  offsetX: number;
  /** lệch của riêng ảnh so với vùng, % kích thước ảnh */
  offsetY: number;
}

// top: vị trí vùng gắn, phần trăm chiều cao khung người (0 = đỉnh, 100 = chân)
// offset: lệch nhỏ của riêng ảnh so với vùng, tính theo phần trăm kích thước ảnh.
const SLOT_DEFAULTS: Record<ItemSlot, SlotDefault> = {
  hat: { label: "Mũ", anchor: "HEAD", top: 6, scale: 1, offsetX: 0, offsetY: 0 },
  glasses: { label: "Kính", anchor: "HEAD", top: 20, scale: 1, offsetX: 0, offsetY: 0 },
  mask: { label: "Mặt nạ", anchor: "HEAD", top: 0, scale: 1, offsetX: 0, offsetY: 0 },
  shirt: { label: "Áo", anchor: "BODY", top: 42, scale: 1, offsetX: 0, offsetY: 0 },
  trousers: { label: "Quần", anchor: "BODY", top: 66, scale: 1, offsetX: 0, offsetY: 0 },
};

/** Suy ra slot từ slug: "hat_circle" -> "hat" */
function slotFromSlug(slug: string): ItemSlot | null {
  const slot = slug.split("_")[0];
  return slot in SLOT_DEFAULTS ? (slot as ItemSlot) : null;
}

export { SLOT_DEFAULTS, slotFromSlug };
