import { isAxiosError } from "axios";
import { MAX_IMAGE_LABEL } from "./image-limit";

/**
 * Lấy câu thông báo lỗi rõ ràng để hiện cho người dùng.
 * Ưu tiên câu máy chủ trả về (đã là tiếng Việt, ví dụ "Ảnh tải lên nặng 812KB, vượt quá 500KB..."),
 * sau đó mới tới các trường hợp mạng / quá dung lượng, cuối cùng mới dùng câu mặc định.
 */
function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError<{ message?: string }>(err)) {
    return fallback;
  }

  const serverMessage = err.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }

  // 413: dữ liệu bị chặn trước khi tới máy chủ (ví dụ proxy giới hạn dung lượng), không có câu báo lỗi
  if (err.response?.status === 413) {
    return `Ảnh gửi lên quá lớn nên máy chủ không nhận. Ảnh tối đa ${MAX_IMAGE_LABEL}, vui lòng nén hoặc chọn ảnh nhẹ hơn.`;
  }

  if (err.code === "ECONNABORTED") {
    return "Máy chủ phản hồi quá lâu, vui lòng thử lại.";
  }

  if (!err.response) {
    return "Không kết nối được máy chủ, vui lòng kiểm tra mạng và thử lại.";
  }

  return fallback;
}

export { getApiErrorMessage };
