const newsTabs = [
  { id: "all", label: "Tất cả" },
  { id: "news", label: "Tin tức" },
  { id: "discovery", label: "Khám phá" },
  { id: "community", label: "Cộng đồng" },
  { id: "events", label: "Sự kiện" },
] as const;

type NewsTabId = (typeof newsTabs)[number]["id"];

const newsPage = {
  title: "Nhật Trình Báo Chí",
  subtitle: "Bản tin di sản văn hóa, khoa học thực nghiệm và cộng đồng học tập Project30TR",
  routes: {
    index: "/tin-tuc",
  },
  tabs: newsTabs,
  descriptions: {
    index: "Tổng hợp các phóng sự tiêu điểm, ghi chép hành trình thực địa và bản tin cộng đồng mới nhất.",
    all: "Tổng hợp các phóng sự tiêu điểm, ghi chép hành trình thực địa và bản tin cộng đồng mới nhất.",
    news: "Thông báo chính thức, cập nhật hệ thống phòng thí nghiệm và tính năng mới.",
    discovery: "Ghi chép lịch sử, sổ tay điều chế cổ truyền và những bí ẩn văn hóa dân gian.",
    community: "Nơi các nhóm thám hiểm chia sẻ kinh nghiệm, thảo luận và kết nối đồng đội.",
    events: "Lịch tổ chức workshop offline, tọa đàm trực tuyến và các buổi hội đền sinh hoạt.",
  },
  empties: {
    all: "Chưa có bài viết nào.",
    news: "Chưa có bài viết tin tức nào.",
    discovery: "Chưa có bài viết khám phá nào.",
    community: "Chưa có bài viết thảo luận cộng đồng nào.",
    events: "Chưa có sự kiện nào được lên lịch.",
  },
} as const;

export { newsPage };
export type { NewsTabId };
