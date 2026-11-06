import { MAX_IMAGE_BYTES, getDataUrlBytes, getDataUrlError, getImageTypeError } from "./image-limit";

// =============================================================================
// NÉN ẢNH NGAY TRÊN TRÌNH DUYỆT TRƯỚC KHI GỬI LÊN (backend không tốn công)
//
// Ảnh chụp/ảnh gốc thường 2000-4000px, nặng vài MB, trong khi web chỉ hiển thị
// ~300-1000px. Thu nhỏ + chuyển WebP giảm ~90% dung lượng lưu trữ lẫn băng thông.
//
// - Thu về tối đa maxSize px (giữ tỉ lệ, không phóng to ảnh nhỏ).
// - Ưu tiên WebP. Trình duyệt không xuất được WebP (Safari) thì thử JPEG cho ảnh không
//   trong suốt, PNG cho ảnh trong suốt (để không bị nền đen).
// - Luôn chọn bản NHẸ NHẤT, kể cả ảnh gốc nếu ảnh gốc đã nhẹ hơn.
// - Còn quá giới hạn thì giảm dần chất lượng rồi kích thước.
// - SVG / GIF giữ nguyên (nén sẽ mất ảnh vector / ảnh động), chỉ kiểm tra dung lượng.
// =============================================================================

interface CompressOptions {
  /** Cạnh dài nhất sau khi thu nhỏ (px) */
  maxSize?: number;
  /** Chất lượng khởi đầu 0-1 */
  quality?: number;
}

/** Ảnh gốc quá lớn thì từ chối luôn, tránh tràn bộ nhớ khi giải mã (ảnh 100MP...) */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
    reader.readAsDataURL(file);
  });
}

async function loadImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  // createImageBitmap giải mã nhanh và tự xoay đúng chiều ảnh chụp điện thoại (EXIF)
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Trình duyệt cũ không hỗ trợ tuỳ chọn: thử cách thường bên dưới
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("Không đọc được ảnh, tệp có thể bị hỏng hoặc định dạng không được hỗ trợ.");
  }
}

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4 * 7) {
    if (data[i] < 250) return true;
  }
  return false;
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): string | null {
  const out = canvas.toDataURL(type, quality);
  // Trình duyệt không hỗ trợ định dạng sẽ lặng lẽ trả PNG: coi như không xuất được
  return out.startsWith(`data:${type}`) ? out : null;
}

/**
 * Nén ảnh người dùng chọn và trả về chuỗi Base64 (data:image/...) sẵn sàng gửi lên.
 * Ném Error kèm câu thông báo tiếng Việt nếu ảnh không hợp lệ hoặc vẫn vượt giới hạn.
 */
async function compressImageFile(file: File, { maxSize = 1280, quality = 0.82 }: CompressOptions = {}): Promise<string> {
  const typeError = getImageTypeError(file);
  if (typeError) throw new Error(typeError);
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`Ảnh "${file.name}" quá lớn (${Math.ceil(file.size / 1024 / 1024)}MB). Vui lòng chọn ảnh dưới 25MB.`);
  }

  const original = await readAsDataUrl(file);

  // Ảnh vector / ảnh động: không nén qua canvas
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    const sizeError = getDataUrlError(original);
    if (sizeError) throw new Error(sizeError);
    return original;
  }

  const image = await loadImage(file);
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return finalize(original, original);

    let best = original;
    let scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    let q = quality;

    // Tối đa 10 vòng: giảm chất lượng trước (xuống ~0,4), rồi mỗi vòng thu nhỏ còn 75%.
    // Ảnh thường chỉ cần 1 vòng; vòng lặp chỉ chạy nhiều với ảnh cực nhiều chi tiết.
    for (let attempt = 0; attempt < 10; attempt++) {
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image.source, 0, 0, width, height);

      const candidates = [encode(canvas, "image/webp", q)];
      if (!candidates[0]) {
        // Không xuất được WebP (Safari): ảnh trong suốt giữ PNG, còn lại dùng JPEG
        candidates.push(
          hasTransparency(ctx, width, height) ? canvas.toDataURL("image/png") : encode(canvas, "image/jpeg", q),
        );
      }

      for (const candidate of candidates) {
        if (candidate && candidate.length < best.length) best = candidate;
      }

      if (getDataUrlBytes(best) <= MAX_IMAGE_BYTES) break;
      if (q > 0.5) q -= 0.15;
      else scale *= 0.75;
    }

    return finalize(best, original);
  } finally {
    image.close();
  }
}

function finalize(best: string, original: string): string {
  const chosen = best.length < original.length ? best : original;
  const sizeError = getDataUrlError(chosen);
  if (sizeError) throw new Error(sizeError);
  return chosen;
}

export { compressImageFile };
export type { CompressOptions };
