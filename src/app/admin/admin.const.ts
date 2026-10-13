const adminTabs = {
  overview: "overview",
  rooms: "rooms",
  lessons: "lessons",
  users: "users",
  articles: "articles",
  coins: "coins",
  social: "social",
  cart: "cart",
} as const;

type AdminTab = (typeof adminTabs)[keyof typeof adminTabs];

const adminPage = {
  title: "Hệ thống quản trị",
  description: "Trang điều hành và quản lý hệ thống dành cho Quản trị viên.",
  backHome: "Quay lại",
  tabs: {
    overview: "Tổng quan",
    rooms: "Phòng học",
    lessons: "Bài học",
    users: "Tài khoản",
    articles: "Tin tức",
    coins: "Xu & Điểm danh",
    social: "Fanpage",
    cart: "Đơn hàng",
  } as Record<AdminTab, string>,

  roomPanel: {
    listTitle: "Danh sách phòng học",
    pickTitle: "Chọn phòng học để quản lý bài học",
    empty: "Chưa có phòng học nào trong hệ thống.",
    pickPlaceholder: "-- Chọn phòng học --",
    noRoomSelected: "Vui lòng chọn phòng học ở trên để quản lý hoặc thêm bài học.",
    lessonsEmpty: "Phòng học này hiện chưa có bài học nào.",
    lessonsTitle: "Danh sách bài học trong phòng",
    confirmDeleteRoom: "Xác nhận xoá phòng học này? Toàn bộ bài học bên trong cũng sẽ bị xoá.",
    confirmDeleteLesson: "Xác nhận xoá bài học này?",
  },
  articlePanel: {
    listTitle: "Danh sách bài viết tin tức",
    createTitle: "Soạn & Xuất bản bài viết mới",
    editTitle: "Chỉnh sửa bài viết",
    empty: "Chưa có bài viết nào trong hệ thống.",
    confirmDelete: "Xác nhận xoá bài viết này khỏi hệ thống?",
    successCreate: "Đã xuất bản bài viết thành công!",
    successUpdate: "Đã cập nhật bài viết thành công!",
    successDelete: "Đã xoá bài viết thành công!",
  },

  userPanel: {
    listTitle: "Danh sách tài khoản",
    searchPlaceholder: "Tìm kiếm theo tên đăng nhập...",
    search: "Tìm kiếm",
    empty: "Không tìm thấy tài khoản nào phù hợp.",
    role: { ADMIN: "Quản trị viên", MEMBER: "Thành viên" } as Record<string, string>,
    promote: "Cấp quyền Admin",
    demote: "Thu hồi quyền Admin",
    you: "Bạn",
    selfNote: "Không thể tự chỉnh sửa quyền hạn của chính mình.",
    images: (count: number) => `${count} ảnh nhật kí`,
    createdAt: (value: string) => `Ngày tạo: ${new Date(value).toLocaleDateString("vi-VN")}`,
    reloginNote: "Tài khoản vừa được cấp quyền cần đăng nhập lại để cập nhật quyền hạn.",
    loading: "Đang tải dữ liệu...",
    loadFailed: "Không thể tải danh sách tài khoản.",
    updateFailed: "Cập nhật quyền hạn thất bại.",
    updateSuccess: "Đã cập nhật quyền hạn thành công.",
    total: (total: number) => `Tổng số: ${total} tài khoản`,
    prev: "Trang trước",
    next: "Trang sau",
  },
  socialPanel: {
    title: "Trang Fanpage / link-in-bio",
    description:
      "Mọi nội dung hiển thị tại /fanpage: hồ sơ, số liệu và link từng kênh mạng xã hội.",
    profileTitle: "Hồ sơ thương hiệu",
    statsTitle: "Hàng số liệu",
    channelsTitle: "Danh sách kênh",
    addChannel: "Thêm kênh",
    removeChannel: "Xoá kênh",
    markFeatured: "Đặt nổi bật",
    unmarkFeatured: "Bỏ nổi bật",
    openPage: "Mở trang Fanpage",
    reset: "Tải lại",
    save: "Lưu cấu hình",
    empty: "Chưa có kênh nào trong cấu hình.",
    confirmRemoveChannel: "Xoá kênh này khỏi trang Fanpage?",
    loadFailed: "Không thể tải cấu hình Fanpage.",
    saveFailed: "Lưu cấu hình Fanpage thất bại.",
    saveSuccess: "Đã lưu cấu hình Fanpage thành công!",
    updatedAt: (value?: string) =>
      value ? `Cập nhật lần cuối: ${new Date(value).toLocaleString("vi-VN")}` : "Chưa có dữ liệu",
  },
  loading: "Đang tải dữ liệu quản trị...",
  forbidden: {
    title: "403 — Không có quyền truy cập",
    message: "Khu vực này chỉ dành riêng cho tài khoản có vai trò Quản trị viên (ADMIN).",
    hint: "Nếu bạn đã được cấp quyền, vui lòng đăng xuất và đăng nhập lại để làm mới phiên làm việc.",
  },
} as const;

export { adminPage, adminTabs };
export type { AdminTab };
