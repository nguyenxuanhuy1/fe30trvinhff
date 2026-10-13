const loginPageContent = {
  title: {
    login: "Đăng nhập",
    register: "Đăng ký tài khoản",
  },
  subtitle: {
    login: "Nhập tài khoản để tiếp tục",
    register: "Tạo tài khoản mới để lưu ảnh nhật kí",
  },
  submitting: "Đang xử lý...",
  switchPrompt: {
    login: "Chưa có tài khoản?",
    register: "Đã có tài khoản?",
  },
  switchAction: {
    login: "Đăng nhập",
    register: "Đăng ký",
  },
  errors: {
    invalidCredentials: "Tài khoản hoặc mật khẩu không đúng",
    passwordMismatch: "Mật khẩu xác nhận không khớp",
    registrationFailed: "Đăng ký thất bại, vui lòng thử lại",
  },
} as const;

export { loginPageContent };
