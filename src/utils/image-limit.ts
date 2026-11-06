/**
 * Giới hạn ảnh tải lên: tối đa 500KB ảnh gốc.
 * Phải khớp với MAX_IMAGE_BYTES ở backend/src/utils/validators.js.
 *
 * Ảnh chuyển sang Base64 dài thêm khoảng 1,33 lần, nên ảnh 500KB
 * thành chuỗi khoảng 667KB khi gửi lên máy chủ.
 */
const MAX_IMAGE_BYTES = 500 * 1024;
const MAX_IMAGE_LABEL = "500KB";

/** Dung lượng thật của ảnh nằm trong chuỗi data:image/...;base64,xxx */
function getDataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = dataUrl.slice(commaIndex + 1).replace(/\s/g, "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function formatKb(bytes: number): string {
  return `${Math.ceil(bytes / 1024)}KB`;
}

/** Câu báo lỗi khi ảnh vượt giới hạn, trả null nếu ảnh hợp lệ. */
function getImageSizeError(bytes: number): string | null {
  if (bytes <= MAX_IMAGE_BYTES) return null;
  return `Ảnh nặng ${formatKb(bytes)}, vượt quá ${MAX_IMAGE_LABEL}. Vui lòng nén hoặc chọn ảnh nhẹ hơn.`;
}

/** Chỉ kiểm tra loại tệp (dùng khi ảnh còn được cắt lại trước khi lưu). */
function getImageTypeError(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return `Tệp "${file.name}" không phải hình ảnh. Vui lòng chọn ảnh PNG, JPG, WEBP, GIF hoặc SVG.`;
  }
  return null;
}

/** Kiểm tra file người dùng chọn trước khi đọc thành Base64. */
function getImageFileError(file: File): string | null {
  return getImageTypeError(file) ?? getImageSizeError(file.size);
}

/** Kiểm tra chuỗi Base64 (ví dụ ảnh sau khi cắt) trước khi gửi lên. */
function getDataUrlError(dataUrl: string): string | null {
  if (!dataUrl.startsWith("data:")) return null;
  return getImageSizeError(getDataUrlBytes(dataUrl));
}

export {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LABEL,
  getDataUrlBytes,
  getImageFileError,
  getImageTypeError,
  getDataUrlError,
};
