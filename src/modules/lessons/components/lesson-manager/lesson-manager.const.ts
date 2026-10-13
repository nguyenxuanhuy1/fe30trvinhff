const lessonManagerContent = {
  createTitle: "Tạo bài học mới",
  editTitle: "Sửa bài học",
  labels: {
    name: "Tên bài học",
    image: "Ảnh bài học (URL)",
    html: "Mã HTML của bài học",
    order: "Thứ tự hiển thị",
  },
  hints: {
    namePlaceholder: "Ví dụ: Bắt tay đầu tiên",
    imagePlaceholder: "https://...",
    htmlPlaceholder: "<!doctype html>...",
    orderPlaceholder: "Để trống thì tự động",
  },
  saving: "Đang lưu...",
  buttons: {
    save: "Lưu",
    cancel: "Huỷ",
  },
  // Sửa bài học mà không nhập gì vào ô HTML thì giữ nguyên nội dung cũ
  keepHtmlNote: "Để trống ô này khi sửa thì giữ nguyên HTML hiện tại.",
};

export { lessonManagerContent };
