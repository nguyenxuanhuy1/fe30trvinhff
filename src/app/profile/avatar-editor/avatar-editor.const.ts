const avatarEditor = {
  alt: "Avatar",
  label: "Đường dẫn ảnh",
  placeholder: "https://...",
  change: "Đổi ảnh",
  save: "Lưu",
  cancel: "Huỷ",
  saving: "Đang lưu...",
  errors: {
    empty: "Vui lòng nhập đường dẫn ảnh",
    failed: "Cập nhật thất bại, vui lòng thử lại",
  },
} as const;

export { avatarEditor };
