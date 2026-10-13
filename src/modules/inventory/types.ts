// Loại đồ trong catalog.json. Không có trong DB, chỉ đọc từ
// public/items/catalog.json (server cũng đọc cùng file này để validate).
//
// Quy ước: id là slug của file ảnh, ví dụ "hat_circle" -> /items/hat_circle.webp.
// Slot suy ra từ chữ trước dấu gạch dưới đầu tiên, xem src/config/itemSlots.js
// của backend để biết giá trị và vị trí gắn mặc định của từng slot.
type ItemSlot = "hat" | "glasses" | "mask" | "shirt" | "trousers";
type ItemAnchor = "HEAD" | "BODY";

/** Nội dung ghi trong public/items/catalog.json: mỗi món chỉ cần tên + bài mở khoá */
interface CatalogItemMeta {
  name: string;
  /** id bài học mở khoá món đồ này */
  unlockedBy: string;
}

/** Đồ sau khi useCatalog bổ sung slot, vị trí gắn và đường dẫn ảnh */
interface CatalogItem extends CatalogItemMeta {
  id: string;
  slot: ItemSlot;
  anchor: ItemAnchor;
  scale: number;
  offsetX: number;
  offsetY: number;
  /** suy ra từ quy ước public/items/<id>.webp */
  imageUrl: string;
}

// catalog.json là object khoá = slug của đồ
/** Lưu ý: catalog.json mới không ghi scale/offset, ta ghi đè theo slot */
interface CatalogRawItem {
  name: string;
  unlockedBy: string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  ext?: string;
}

type CatalogRaw = Record<string, CatalogRawItem>;

/** Tủ đồ. API trả về đúng 2 mảng id, không có object nặng. */
interface Inventory {
  owned: string[];
  equipped: string[];
}

interface EquippedResponse {
  equipped: string[];
}

interface LevelCompleteResponse {
  rewards: string[];
}

interface LabLesson {
  id: string;
  name: string;
  slug: string | null;
  path: string | null;
  requiredSlots: ItemSlot[];
  published: boolean;
  order: number;
  imageUrl: string | null;
  roomId?: string;
}
interface LabEnterResponse {
  lessonPath: string;
  equipped: string[];
  labToken: string;
}

export type {
  ItemSlot,
  ItemAnchor,
  CatalogItemMeta,
  CatalogItem,
  CatalogRaw,
  CatalogRawItem,
  Inventory,
  EquippedResponse,
  LevelCompleteResponse,
  LabLesson,
  LabEnterResponse,
};
