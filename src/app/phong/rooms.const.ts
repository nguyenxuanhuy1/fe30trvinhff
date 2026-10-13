const roomsPage = {
  title: "Phòng",
  description: "Chọn một phòng để vào các bài học bên trong.",
  hints: {
    empty: "Chưa có phòng nào.",
    noImage: "Chưa có ảnh",
  },
  lessons: (count: number) => `${count} bài học`,
  loading: "Đang tải...",
  loadFailed: "Không tải được danh sách phòng.",
} as const;

const lessonsPage = {
  title: "Bài học",
  backLabel: "Về danh sách phòng",
  emptyDescription: "Danh sách bài học của phòng.",
  hints: {
    empty: "Phòng này chưa có bài học nào.",
    noImage: "Chưa có ảnh",
  },
  loading: "Đang tải...",
  loadFailed: "Không tải được danh sách bài học.",
} as const;

// Khung chạy bài học: html của bài học được đưa vào iframe nên nó chạy độc lập
const lessonPage = {
  backLabel: "Về danh sách bài học",
  emptyHtml: "Bài học này chưa có nội dung HTML. Admin có thể dán mã vào để chạy.",
  loadFailed: "Không tải được bài học.",
  notFound: "Không tìm thấy bài học.",
  frameTitle: "Nội dung bài học",
} as const;

export { roomsPage, lessonsPage, lessonPage };
