export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return "";
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // As a base64 string, resize to reasonable dimension for avatar (max 400px)
  const MAX_DIM = 400;
  if (pixelCrop.width > MAX_DIM || pixelCrop.height > MAX_DIM) {
    const scale = Math.min(MAX_DIM / pixelCrop.width, MAX_DIM / pixelCrop.height);
    const targetW = Math.round(pixelCrop.width * scale);
    const targetH = Math.round(pixelCrop.height * scale);

    const resizedCanvas = document.createElement("canvas");
    resizedCanvas.width = targetW;
    resizedCanvas.height = targetH;
    const resizedCtx = resizedCanvas.getContext("2d");
    if (resizedCtx) {
      resizedCtx.drawImage(canvas, 0, 0, targetW, targetH);
      return resizedCanvas.toDataURL("image/webp", 0.85);
    }
  }

  return canvas.toDataURL("image/webp", 0.85);
}
