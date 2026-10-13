// Tủ đồ: danh mục đồ, API gọi đồ, hooks React Query và các component.
// Vào bài thí nghiệm không bắt buộc mặc đồ, nên tủ đồ chỉ lo phần trang bị ở
// sảnh chờ. localStorage chỉ để preload ảnh, server vẫn là nguồn sự thật.
export { useCatalog } from "./hooks/use-catalog";
export { useInventory } from "./hooks/use-inventory";
export { useEquip } from "./hooks/use-equip";
export { useItemPreload, useEquippedItems } from "./hooks/use-item-preload";
export {
  getInventory,
  equipItem,
  unequipItem,
  completeLevel,
  listLessons,
  enterLab,
  saveLabResult,
} from "./services/inventory.service";
export { AvatarPreview, CameraPreview, InventoryView, ItemGrid } from "./components";
export type {
  InventoryViewProps,
  AvatarPreviewProps,
  CameraPreviewApi,
  CameraPreviewProps,
  ItemGridProps,
} from "./components";
export { SLOT_DEFAULTS, slotFromSlug } from "./item-slots";
export {
  inventoryPage,
  inventoryView,
  slotLabels,
  anchorLabels,
  slotOrder,
} from "./inventory.const";
export type {
  ItemSlot,
  ItemAnchor,
  CatalogItem,
  CatalogItemMeta,
  CatalogRawItem,
  CatalogRaw,
  Inventory,
  EquippedResponse,
  LevelCompleteResponse,
  LabLesson,
  LabEnterResponse,
} from "./types";
