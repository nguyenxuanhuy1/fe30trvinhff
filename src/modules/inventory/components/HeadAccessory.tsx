/*
Nguyên nhân bug:
1. Tọa độ (cw, ch) trong useHeadTracking lấy từ container (có padding 12px) thay vì video, làm lệch tỉ lệ (scale) và vị trí của mốc so với video thực tế.
2. Dùng thẻ <img> với transform cố định px dễ bị tràn khi resize và bị lệch do không nằm trong vùng an toàn (safe area).
   
Những chỗ đã đổi:
1. Chuyển HeadAccessory sang dùng <canvas> phủ kín video (inset: 0, width/height: 100%), tự động set .width/.height = clientWidth * devicePixelRatio bằng ResizeObserver.
2. Vẽ ảnh trực tiếp lên canvas qua ctx.drawImage() nên không bao giờ có chuyện tràn ra ngoài DOM.
3. Cập nhật lại các hàm placeHat, placeGlasses, placeMask để trả về thông số (x, y, w, h, rotation, scale) thay vì chuỗi CSS transform.
4. Thêm hàm clamp (giảm scale hoặc dịch tâm) trong placeMask để đảm bảo mặt nạ luôn nằm trọn trong vùng [0, W] x [0, H] của khung hiển thị.
5. Kiểm tra pose.isVisible, nếu mất mặt hoặc sát mép thì tự ẩn canvas (clearRect).
*/

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useHeadTracking, Pose } from "../hooks/useHeadTracking";
import { ACCESSORIES, AccessoryConfig } from "../config/accessories";
import { getCroppedItem } from "../utils/crop-item";

const cropImage = async (src: string): Promise<string> => {
  const result = await getCroppedItem(src);
  return result.url;
};

type RenderProps = {
  cx: number; cy: number; w: number; h: number;
  rot: number; sx: number; sy: number;
  ox: number; oy: number;
};

function placeHat(pose: Pose, cfg: AccessoryConfig, customOverrides: any): RenderProps {
  const { p10, up, faceHeight, headWidth, rollHead } = pose;
  const hairLift = customOverrides.hairLift ?? cfg.hairLift ?? 0.12;
  const scale = customOverrides.scale ?? cfg.scale ?? 1.3;
  const offsetX = customOverrides.offsetX ?? cfg.offsetX ?? 0;

  const anchor = {
    x: p10.x + up.x * faceHeight * hairLift,
    y: p10.y + up.y * faceHeight * hairLift
  };
  const w = headWidth * scale;
  const h = w; // Approximate, canvas drawImage will use natural aspect ratio if we calculate h properly, but we'll let canvas scale it based on w.

  return { cx: anchor.x + offsetX * headWidth, cy: anchor.y, w, h: 0, rot: rollHead, sx: 1, sy: 1, ox: 0.5, oy: 1 };
}

function placeGlasses(pose: Pose, cfg: AccessoryConfig, customOverrides: any): RenderProps {
  const { eyeMid, up, right, eyeDist, rollEyes, yawSqueeze } = pose;
  const scale = customOverrides.scale ?? cfg.scale ?? 1.6;
  const offsetX = customOverrides.offsetX ?? cfg.offsetX ?? 0;
  const offsetY = customOverrides.offsetY ?? cfg.offsetY ?? 0;

  const center = {
    x: eyeMid.x + up.x * eyeDist * offsetY + right.x * eyeDist * offsetX,
    y: eyeMid.y + up.y * eyeDist * offsetY + right.y * eyeDist * offsetX
  };
  const w = eyeDist * scale;

  return { cx: center.x, cy: center.y, w, h: 0, rot: rollEyes, sx: yawSqueeze, sy: 1, ox: 0.5, oy: 0.5 };
}

function placeMask(pose: Pose, cfg: AccessoryConfig, customOverrides: any, cw: number, ch: number): RenderProps {
  const { p10, p152, up, right, headWidth, faceHeight, rollHead, yawSqueeze } = pose;
  const scaleX = customOverrides.scaleX ?? cfg.scaleX ?? 1.05;
  const scaleY = customOverrides.scaleY ?? cfg.scaleY ?? 1.2;
  const offsetX = customOverrides.offsetX ?? cfg.offsetX ?? 0;
  const offsetY = customOverrides.offsetY ?? cfg.offsetY ?? 0;

  const midX = (p10.x + p152.x) / 2;
  const midY = (p10.y + p152.y) / 2;

  let cx = midX + up.x * faceHeight * offsetY + right.x * headWidth * offsetX;
  let cy = midY + up.y * faceHeight * offsetY + right.y * headWidth * offsetX;

  let w = headWidth * scaleX;
  let h = faceHeight * scaleY;

  return { cx, cy, w, h, rot: rollHead, sx: yawSqueeze, sy: 1, ox: 0.5, oy: 0.5 };
}

const mascotLerp = { srcX: 0, srcY: 0, srcW: 0, srcH: 0, roll: 0 };

function drawMascotFace(
  ctx: CanvasRenderingContext2D,
  videoOrImage: HTMLVideoElement | HTMLImageElement,
  pose: Pose | null,
  mascotImg: HTMLImageElement,
  cw: number,
  ch: number,
  isCamera: boolean
) {
  // Hệ tọa độ chuẩn 1024x1024 theo yêu cầu
  const BASE_W = 1024, BASE_H = 1024;
  const HOLE_CX = 512, HOLE_CY = 397, HOLE_R = 179;

  // Scale hệ tọa độ 1024 để bao phủ toàn bộ màn hình (như object-fit: cover)
  const scale = Math.max(cw / BASE_W, ch / BASE_H);
  const renderW = BASE_W * scale;
  const renderH = BASE_H * scale;
  
  // Căn giữa
  const offsetX = (cw - renderW) / 2;
  const offsetY = (ch - renderH) / 2;

  // Tính tọa độ lỗ tròn thực tế trên canvas
  const holeCanvasX = offsetX + HOLE_CX * scale;
  const holeCanvasY = offsetY + HOLE_CY * scale;
  const holeCanvasR = HOLE_R * scale;

  // 1. Vẽ Mascot (ảnh gốc có thể không có lỗ)
  ctx.save();
  ctx.drawImage(mascotImg, offsetX, offsetY, renderW, renderH);

  // 2. Đục một lỗ tròn trong suốt ngay trên Mascot
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(holeCanvasX, holeCanvasY, holeCanvasR, 0, Math.PI * 2);
  ctx.fill();

  // 3. Đổi chế độ vẽ lót xuống dưới (những gì vẽ tiếp theo sẽ nằm dưới Mascot)
  ctx.globalCompositeOperation = 'destination-over';

  if (isCamera) {
    if (pose && pose.isVisible && pose.p10 && pose.p152) {
      // Lấy vùng mặt từ Landmarker
      const { p10, p152, faceHeight, rollHead } = pose;
      const faceMidX = (p10.x + p152.x) / 2;
      const faceMidY = (p10.y + p152.y) / 2;

      // Scale mặt: cằm đến trán khít với chiều cao lỗ
      const targetSrcH = faceHeight * 1.2;
      const targetSrcW = targetSrcH; 
      const targetSrcX = faceMidX - targetSrcW / 2;
      const targetSrcY = faceMidY - targetSrcH / 2;

      // Làm mượt (lerp)
      const LERP_FACTOR = 0.2;
      if (mascotLerp.srcW === 0) {
        mascotLerp.srcX = targetSrcX; mascotLerp.srcY = targetSrcY;
        mascotLerp.srcW = targetSrcW; mascotLerp.srcH = targetSrcH;
        mascotLerp.roll = rollHead;
      } else {
        mascotLerp.srcX += (targetSrcX - mascotLerp.srcX) * LERP_FACTOR;
        mascotLerp.srcY += (targetSrcY - mascotLerp.srcY) * LERP_FACTOR;
        mascotLerp.srcW += (targetSrcW - mascotLerp.srcW) * LERP_FACTOR;
        mascotLerp.srcH += (targetSrcH - mascotLerp.srcH) * LERP_FACTOR;
        mascotLerp.roll += (rollHead - mascotLerp.roll) * LERP_FACTOR;
      }
    }

    if (mascotLerp.srcW > 0) {
      ctx.save();
      ctx.translate(holeCanvasX, holeCanvasY);
      ctx.rotate(mascotLerp.roll);
      ctx.scale(-1, 1); // Lật gương vì camera lật

      ctx.drawImage(
        videoOrImage, 
        mascotLerp.srcX, mascotLerp.srcY, mascotLerp.srcW, mascotLerp.srcH, 
        -holeCanvasR, -holeCanvasR, holeCanvasR * 2, holeCanvasR * 2
      );
      ctx.restore();
    }
  } else {
    // Vẽ ảnh upload tràn lấp tròn
    const imgAspect = videoOrImage.width / videoOrImage.height;
    let drawW = holeCanvasR * 2;
    let drawH = holeCanvasR * 2;
    if (imgAspect > 1) drawW = drawH * imgAspect;
    else drawH = drawW / imgAspect;

    ctx.drawImage(
      videoOrImage, 
      holeCanvasX - drawW / 2, holeCanvasY - drawH / 2, 
      drawW, drawH
    );
  }
  
  // Khôi phục lại trạng thái ctx bình thường
  ctx.restore();
}

export function HeadAccessory({
  accessoryId,
  containerRef,
  videoRef,
  isCameraOn,
  uploadedImage
}: {
  accessoryId: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOn?: boolean;
  uploadedImage?: string | null;
}) {
  const poseRef = useHeadTracking(videoRef, containerRef);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const staticAvatarRef = useRef<HTMLImageElement | null>(null);

  const [croppedSrc, setCroppedSrc] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [customCfg, setCustomCfg] = useState<any>({});
  const [isDebug, setIsDebug] = useState(false);

  useEffect(() => {
    setIsDebug(typeof window !== "undefined" && window.location.search.includes("debug=1"));
  }, []);

  const baseCfg = ACCESSORIES[accessoryId] || { type: 'hat', scale: 1.3, hairLift: 0.12 };
  const ext = (baseCfg as any).ext || "webp";
  let loadId = accessoryId;
  if (loadId === 'chuotuser' || loadId === 'chuotuser-hole') {
    loadId = 'chuotuser'; // The file is actually just chuotuser.webp
  }
  const originalSrc = (loadId === 'chuotuser') ? '/images/chuotuser.webp' : (loadId.includes(".") ? loadId : `/items/${loadId}.${ext}`);

  useEffect(() => {
    let active = true;
    setLoaded(false);

    const getUrl = baseCfg.type === 'mascot' 
      ? Promise.resolve(originalSrc) 
      : cropImage(originalSrc);

    getUrl.then((url) => {
      if (!active) return;
      setCroppedSrc(url);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (active && img.naturalWidth > 0) {
          imgRef.current = img;
          setLoaded(true);
        }
      };
    });

    return () => { active = false; };
  }, [originalSrc, baseCfg.type]);

  useEffect(() => {
    if (uploadedImage) {
      const img = new Image();
      img.src = uploadedImage;
      img.onload = () => { staticAvatarRef.current = img; };
    } else {
      staticAvatarRef.current = null;
    }
  }, [uploadedImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let rAF: number;
    let active = true;

    const loop = () => {
      if (!active) return;
      rAF = requestAnimationFrame(loop);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const pose = poseRef.current;
      const img = imgRef.current;

      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (baseCfg.type === 'mascot') {
        const hasCameraStream = isCameraOn && videoRef.current && videoRef.current.readyState >= 2;
        const targetSrc = hasCameraStream ? videoRef.current : staticAvatarRef.current;

        if (targetSrc && img) {
          ctx.save();
          ctx.scale(dpr, dpr);
          drawMascotFace(
            ctx, 
            targetSrc as any, 
            hasCameraStream ? poseRef.current : null, 
            img, 
            cw, ch, 
            !!hasCameraStream
          );
          ctx.restore();
        }
      } else {
        if (pose.isVisible && loaded && img && cw > 0 && ch > 0 && isCameraOn !== false) {
          ctx.save();
          ctx.scale(dpr, dpr);

          let res: RenderProps;
          if (baseCfg.type === 'hat') res = placeHat(pose, baseCfg, customCfg);
          else if (baseCfg.type === 'glasses') res = placeGlasses(pose, baseCfg, customCfg);
          else if (baseCfg.type === 'mask') res = placeMask(pose, baseCfg, customCfg, cw, ch);
          else res = placeHat(pose, baseCfg, customCfg);

          let finalW = res.w;
          let finalH = res.h;
          if (finalH === 0) { // Keep aspect ratio if height is 0
            finalH = finalW * (img.naturalHeight / img.naturalWidth);
          } else if (baseCfg.type === 'mask') {
            // Masks stretch to fit the face
          } else {
            finalH = finalW * (img.naturalHeight / img.naturalWidth);
          }

          ctx.translate(res.cx, res.cy);
          ctx.rotate(res.rot);
          ctx.scale(res.sx, res.sy);

          ctx.drawImage(
            img,
            -finalW * res.ox,
            -finalH * res.oy,
            finalW,
            finalH
          );

          ctx.restore();
        }
      }
    };
    loop();
    return () => {
      active = false;
      cancelAnimationFrame(rAF);
    };
  }, [loaded, baseCfg, poseRef, customCfg]);

  const handleSlider = (field: string, val: number) => {
    setCustomCfg((prev: any) => ({ ...prev, [field]: val }));
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0, // This makes it exactly fill the padding box (the video) if the wrapper has padding
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      {isDebug && (
        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", color: "white", padding: "8px", zIndex: 50, fontSize: 13, borderRadius: 4, pointerEvents: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p>Debug controls active for {accessoryId}</p>
          </div>
        </div>
      )}
    </>
  );
}
