const inventoryPage = {
  title: "Tủ đồ",
  description: "Trang bị đồ đồ dùng cho các bài thí nghiệm.",
  backToLessons: "Về danh sách bài",
  empty: "Tủ đồ của bạn đang trống. Hoàn thành màn chơi để nhận đồ nhé.",
} as const;

const slotLabels: Record<string, string> = {
  hat: "Mũ",
  glasses: "Kính",
  mask: "Mặt nạ",
  shirt: "Áo",
  trousers: "Quần",
};

const anchorLabels: Record<string, string> = {
  HEAD: "đầu",
  BODY: "thân",
};

/** Thứ tự hiển thị các slot trong tủ đồ và trên người, từ trên xuống */
const slotOrder = ["hat", "glasses", "mask", "shirt", "trousers"] as const;

const inventoryView = {
  equippedTitle: "Đang mặc",
  ownedTitle: "Tất cả đồ",
  equippedHint: "Bấm vào đồ đang mặc để tháo ra.",
  ownedHint: "Bấm vào đồ để mặc. Mỗi bộ phận chỉ mặc được 1 món.",
  lockedBadge: "Chưa có",
  lockedHint: "Hoàn thành màn chơi để nhận món này",
  previewEmpty: "Chưa mặc món nào",
  previewHint: "Ảnh xem trước hiển thị theo vị trí: đầu, thân.",
  loadError: "Không tải được danh mục đồ.",
  loginRequired: "Bạn cần đăng nhập để xem tủ đồ.",
  equipFailed: "Không trang bị được món đồ này.",
  unequipFailed: "Không tháo được món đồ này.",
} as const;

export { inventoryPage, inventoryView, slotLabels, anchorLabels, slotOrder };
