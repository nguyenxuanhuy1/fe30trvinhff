export interface CroppedItemResult {
  url: string;
  width: number;
  height: number;
}

const PRECOMPUTED_BBOX: Record<string, { width: number; height: number }> = {
  "/items/hat_circle.webp": { width: 78, height: 60 },
  "/items/hat_cap.webp": { width: 94, height: 62 },
  "/items/glasses_kinh.png": { width: 1056, height: 286 },
  "/items/mask_matla.png": { width: 320, height: 438 },
};

export const croppedCache = new Map<string, CroppedItemResult>();

export const getCroppedItem = (src: string): Promise<CroppedItemResult> => {
  if (croppedCache.has(src)) {
    return Promise.resolve(croppedCache.get(src)!);
  }

  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      const bbox = PRECOMPUTED_BBOX[src] || { width: 100, height: 100 };
      return resolve({ url: src, width: bbox.width, height: bbox.height });
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        const bbox = PRECOMPUTED_BBOX[src] || { width: img.naturalWidth, height: img.naturalHeight };
        const fallback = { url: src, width: bbox.width, height: bbox.height };
        croppedCache.set(src, fallback);
        return resolve(fallback);
      }

      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const alpha = data.data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 10) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX > maxX || minY > maxY) {
        const bbox = PRECOMPUTED_BBOX[src] || { width: img.naturalWidth, height: img.naturalHeight };
        const fallback = { url: src, width: bbox.width, height: bbox.height };
        croppedCache.set(src, fallback);
        return resolve(fallback);
      }

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = maxX - minX + 1;
      croppedCanvas.height = maxY - minY + 1;
      const croppedCtx = croppedCanvas.getContext("2d");
      if (!croppedCtx) {
        const bbox = PRECOMPUTED_BBOX[src] || { width: img.naturalWidth, height: img.naturalHeight };
        const fallback = { url: src, width: bbox.width, height: bbox.height };
        croppedCache.set(src, fallback);
        return resolve(fallback);
      }

      croppedCtx.putImageData(
        ctx.getImageData(minX, minY, croppedCanvas.width, croppedCanvas.height),
        0,
        0,
      );

      const url = croppedCanvas.toDataURL("image/png");
      const result: CroppedItemResult = {
        url,
        width: croppedCanvas.width,
        height: croppedCanvas.height,
      };
      croppedCache.set(src, result);
      resolve(result);
    };

    img.onerror = () => {
      const bbox = PRECOMPUTED_BBOX[src] || { width: 100, height: 100 };
      const fallback = { url: src, width: bbox.width, height: bbox.height };
      resolve(fallback);
    };
  });
};
