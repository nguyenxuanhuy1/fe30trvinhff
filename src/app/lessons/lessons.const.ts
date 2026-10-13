const lessonsLabPage = {
  title: "Bài học thí nghiệm",
  description: "Chọn bài giảng, mặc thử đồ ở sảnh chờ rồi vào thí nghiệm.",
  heading: "Bài giảng",
  subtitle: "Bấm vào bài để sang sảnh chờ. Ở đó bạn mặc thử đồ trước camera rồi vào thí nghiệm.",
  enterLabel: "Vào bài",
  empty: "Chưa có bài giảng nào.",
  loading: "Đang tải...",
  loadFailed: "Không tải được danh sách bài học.",
  loginRequired: "Đăng nhập để xem tủ đồ và vào bài thí nghiệm.",
  loginCta: "Đi tới đăng nhập",
  inventoryCta: "Mở tủ đồ",
} as const;

const lessonPage = {
  backLabel: "Quay lại",
  emptyHtml: "Bài học này chưa có nội dung HTML. Admin có thể dán mã vào để chạy.",
  loadFailed: "Không tải được bài học.",
  notFound: "Không tìm thấy bài học.",
  frameTitle: "Nội dung bài học",
} as const;

export { lessonsLabPage, lessonPage };
