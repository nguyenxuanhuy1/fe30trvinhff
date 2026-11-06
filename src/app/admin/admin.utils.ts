import { MAX_IMAGE_BYTES, MAX_IMAGE_LABEL } from "@/utils/image-limit";
import { compressImageFile, type CompressOptions } from "@/utils/image-compress";
import { getApiErrorMessage } from "@/utils/api-error";

// Giới hạn ảnh dùng chung toàn site (500KB ảnh gốc), khai báo ở utils/image-limit.ts
const MAX_UPLOAD_IMAGE_BYTES = MAX_IMAGE_BYTES;
const MAX_UPLOAD_IMAGE_LABEL = MAX_IMAGE_LABEL;

/**
 * Đọc file ảnh người dùng chọn, NÉN lại (thu nhỏ + WebP) rồi trả chuỗi Base64 (data:image/...).
 * Giới hạn 500KB tính trên ảnh SAU khi nén, nên ảnh chụp vài MB vẫn tải lên được.
 * Ném Error kèm câu thông báo tiếng Việt nếu file không hợp lệ.
 */
function readImageFileAsDataUrl(file: File, options?: CompressOptions): Promise<string> {
  return compressImageFile(file, options);
}

/** Lấy câu thông báo lỗi backend trả về, không có thì dùng câu mặc định. */
function getErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}

/** Lỗi do form antd tự kiểm tra (đã hiện dưới ô nhập), không cần báo thêm. */
function isFormValidationError(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && "errorFields" in err);
}

export {
  MAX_UPLOAD_IMAGE_BYTES,
  MAX_UPLOAD_IMAGE_LABEL,
  readImageFileAsDataUrl,
  getErrorMessage,
  isFormValidationError,
};
