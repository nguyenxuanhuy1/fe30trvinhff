"use client";

import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

export type Point = { x: number; y: number };

export type Pose = {
  p10: Point;
  p152: Point;
  p234: Point;
  p454: Point;
  p1: Point;
  eyeL: Point;
  eyeR: Point;
  eyeMid: Point;
  eyeDist: number;
  headWidth: number;
  faceHeight: number;
  up: Point;
  right: Point;
  rollHead: number;
  rollEyes: number;
  yawSqueeze: number;
  isVisible: boolean;
  ovalPts: Point[];
};

// --- SINGLETON STATE ---
let landmarkerPromise: Promise<FaceLandmarker | null> | null = null;
let landmarkerInstance: FaceLandmarker | null = null;
let activeTrackers = 0;
let loopId: number | null = null;
let isModelLoaded = false;

const subscribers = new Set<() => void>();
function notifyAILoading() {
  subscribers.forEach((fn) => fn());
}

export function useAILoadingState() {
  const [state, setState] = useState({ isTracking: activeTrackers > 0, isLoaded: isModelLoaded });
  useEffect(() => {
    const fn = () => setState({ isTracking: activeTrackers > 0, isLoaded: isModelLoaded });
    subscribers.add(fn);
    return () => { subscribers.delete(fn); };
  }, []);
  return state;
}

const createPoint = () => ({ x: 0, y: 0 });

const sharedPose: Pose = {
  p10: createPoint(),
  p152: createPoint(),
  p234: createPoint(),
  p454: createPoint(),
  p1: createPoint(),
  eyeL: createPoint(),
  eyeR: createPoint(),
  eyeMid: createPoint(),
  eyeDist: 0,
  headWidth: 0,
  faceHeight: 0,
  up: createPoint(),
  right: createPoint(),
  rollHead: 0,
  rollEyes: 0,
  yawSqueeze: 1,
  isVisible: false,
  ovalPts: Array(36).fill(0).map(() => createPoint()),
};

const currentPose: Pose = { ...sharedPose, p10: createPoint(), p152: createPoint(), p234: createPoint(), p454: createPoint(), p1: createPoint(), eyeL: createPoint(), eyeR: createPoint(), eyeMid: createPoint(), up: createPoint(), right: createPoint(), ovalPts: Array(36).fill(0).map(() => createPoint()) };
const targetPose: Pose = { ...sharedPose, p10: createPoint(), p152: createPoint(), p234: createPoint(), p454: createPoint(), p1: createPoint(), eyeL: createPoint(), eyeR: createPoint(), eyeMid: createPoint(), up: createPoint(), right: createPoint(), ovalPts: Array(36).fill(0).map(() => createPoint()) };

const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

let lastVideoTime = -1;
let lastFaceTime = 0;

// =====================================================================
// TẢI MODEL AI MỘT LẦN + LƯU CACHE TRÊN MÁY NGƯỜI DÙNG
//
// - Trong 1 phiên: model chỉ khởi tạo 1 lần (landmarkerPromise dùng chung),
//   chuyển qua lại giữa Tủ đồ / sảnh chờ bài học / phòng thí nghiệm không tải lại.
// - Giữa các lần mở web: file model + wasm (~13MB) được lưu vào Cache Storage
//   của trình duyệt, lần sau đọc thẳng từ máy, không tải qua mạng nữa.
// - Trạng thái (đang tải / xong / lỗi + %) phát cho mọi trang qua useFaceModelStatus
//   để hiện 1 màn loading duy nhất trước khi cho bấm gắn đồ.
// =====================================================================

// Đổi số phiên bản khi thay model hoặc nâng @mediapipe/tasks-vision để xoá cache cũ
const AI_CACHE_NAME = "steamaze-ai-models-v1";
const WASM_BASE = "/vendor/tasks-vision/wasm";
const FACE_MODEL_URL = "/models/face_landmarker.task";

export type FaceModelStatus = "idle" | "loading" | "ready" | "error";

let modelStatus: FaceModelStatus = "idle";
let modelProgress = 0; // 0..100
const statusListeners = new Set<() => void>();

function setModelStatus(status: FaceModelStatus, progress = modelProgress) {
  modelStatus = status;
  modelProgress = Math.max(0, Math.min(100, Math.round(progress)));
  statusListeners.forEach((fn) => fn());
}

/** Trạng thái tải model AI, dùng chung cho mọi trang có camera. */
export function useFaceModelStatus() {
  const [snapshot, setSnapshot] = useState({ status: modelStatus, progress: modelProgress });
  useEffect(() => {
    const fn = () => setSnapshot({ status: modelStatus, progress: modelProgress });
    statusListeners.add(fn);
    fn();
    return () => {
      statusListeners.delete(fn);
    };
  }, []);
  return snapshot;
}

/** Model đã sẵn sàng trong bộ nhớ chưa (đồng bộ, không cần chờ). */
export function isFaceModelReady() {
  return modelStatus === "ready";
}

/**
 * Lấy file từ Cache Storage của máy; chưa có thì tải qua mạng rồi lưu lại.
 * onBytes báo số byte đã nhận để tính % tổng.
 */
async function fetchWithDeviceCache(
  url: string,
  onBytes: (loaded: number, total: number) => void,
): Promise<ArrayBuffer> {
  let cache: Cache | null = null;
  try {
    if ("caches" in window) {
      cache = await caches.open(AI_CACHE_NAME);
      const hit = await cache.match(url);
      if (hit) {
        const buf = await hit.arrayBuffer();
        onBytes(buf.byteLength, buf.byteLength);
        return buf;
      }
    }
  } catch {
    // Cache Storage bị chặn (chế độ riêng tư...) thì tải thường
    cache = null;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Không tải được ${url} (${res.status})`);
  }

  const total = Number(res.headers.get("content-length")) || 0;
  let buf: ArrayBuffer;

  if (res.body && total > 0) {
    // Đọc theo từng phần để hiện % tải
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.byteLength;
      onBytes(loaded, total);
    }
    const out = new Uint8Array(loaded);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.byteLength;
    }
    buf = out.buffer as ArrayBuffer;
  } else {
    buf = await res.arrayBuffer();
    onBytes(buf.byteLength, buf.byteLength);
  }

  if (cache) {
    try {
      await cache.put(
        url,
        new Response(buf.slice(0), {
          headers: { "Content-Type": res.headers.get("content-type") || "application/octet-stream" },
        }),
      );
    } catch {
      // Hết dung lượng lưu trữ thì bỏ qua, lần sau tải lại qua mạng
    }
  }

  return buf;
}

export function preloadFaceLandmarker(): Promise<FaceLandmarker | null> | null {
  if (typeof window === "undefined") return null;

  if (!landmarkerPromise) {
    setModelStatus("loading", 0);

    landmarkerPromise = (async () => {
      const blobUrls: string[] = [];
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");

        // FilesetResolver tự chọn bản wasm có/không SIMD hợp với máy
        const paths = await FilesetResolver.forVisionTasks(WASM_BASE);

        // 3 file cần tải, cộng dồn byte để ra % chung
        const progress = new Map<string, { loaded: number; total: number }>();
        const report = (key: string) => (loaded: number, total: number) => {
          progress.set(key, { loaded, total });
          let sumLoaded = 0;
          let sumTotal = 0;
          progress.forEach((p) => {
            sumLoaded += p.loaded;
            sumTotal += p.total;
          });
          // Dành 10% cuối cho bước khởi tạo model trên GPU/CPU
          if (sumTotal > 0 && progress.size === 3) {
            setModelStatus("loading", Math.min(1, sumLoaded / sumTotal) * 90);
          }
        };

        const [loaderBuf, wasmBuf, modelBuf] = await Promise.all([
          fetchWithDeviceCache(paths.wasmLoaderPath, report("loader")),
          fetchWithDeviceCache(paths.wasmBinaryPath, report("wasm")),
          fetchWithDeviceCache(FACE_MODEL_URL, report("model")),
        ]);
        setModelStatus("loading", 90);

        // Đưa file từ bộ nhớ vào MediaPipe qua blob URL, không gọi mạng nữa
        const loaderUrl = URL.createObjectURL(new Blob([loaderBuf], { type: "text/javascript" }));
        const wasmUrl = URL.createObjectURL(new Blob([wasmBuf], { type: "application/wasm" }));
        blobUrls.push(loaderUrl, wasmUrl);
        const fileset = { ...paths, wasmLoaderPath: loaderUrl, wasmBinaryPath: wasmUrl };
        const modelBytes = new Uint8Array(modelBuf);

        let created: FaceLandmarker;
        try {
          created = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetBuffer: modelBytes, delegate: "GPU" },
            runningMode: "VIDEO",
            numFaces: 1,
          });
        } catch (e) {
          console.warn("GPU failed, falling back to CPU", e);
          created = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetBuffer: modelBytes, delegate: "CPU" },
            runningMode: "VIDEO",
            numFaces: 1,
          });
        }

        landmarkerInstance = created;
        setModelStatus("ready", 100);
        return created;
      } catch (err) {
        console.error("Lỗi khi tải FaceLandmarker:", err);
        // Cho phép thử lại ở lần mở trang sau
        landmarkerPromise = null;
        setModelStatus("error", 0);
        throw err;
      } finally {
        // MediaPipe đã đọc xong file vào bộ nhớ, giải phóng blob URL
        blobUrls.forEach((u) => URL.revokeObjectURL(u));
      }
    })();
  }

  return landmarkerPromise;
}

export function useHeadTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const poseRef = useRef(sharedPose);
  const dimsRef = useRef({ cw: 0, ch: 0, vw: 0, vh: 0 });

  useEffect(() => {
    let active = true;
    activeTrackers++;
    notifyAILoading();

    const updateDims = () => {
      if (containerRef.current && videoRef.current) {
        dimsRef.current = {
          cw: containerRef.current.clientWidth,
          ch: containerRef.current.clientHeight,
          vw: videoRef.current.videoWidth,
          vh: videoRef.current.videoHeight,
        };
      }
    };

    const resizeObserver = new ResizeObserver(updateDims);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (videoRef.current) {
      videoRef.current.addEventListener("loadedmetadata", updateDims);
      videoRef.current.addEventListener("playing", updateDims);
    }

    async function init() {
      try {
        const promise = preloadFaceLandmarker();
        if (promise) {
          const lmInstance = await promise;
          if (!active) return;
          landmarkerInstance = lmInstance;
        }
      } catch (err) {
        console.error("Không thể khởi tạo model nhận diện khuôn mặt:", err);
      } finally {
        isModelLoaded = true;
        notifyAILoading();
      }

      if (activeTrackers > 0 && loopId === null) {
        const loop = () => {
          if (activeTrackers <= 0) {
            loopId = null;
            return;
          }
          loopId = requestAnimationFrame(loop);

          if (document.visibilityState !== "visible") return;

          const video = videoRef.current;
          if (!video || video.readyState < 2 || !landmarkerInstance) return;

          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            const now = performance.now();
            const results = landmarkerInstance.detectForVideo(video, now);

            const { cw, ch, vw, vh } = dimsRef.current;
            if (cw > 0 && vw > 0 && results.faceLandmarks?.length > 0) {
              const lm = results.faceLandmarks[0];
              const s = Math.max(cw / vw, ch / vh);
              const ox = (cw - vw * s) / 2;
              const oy = (ch - vh * s) / 2;

              const toPx = (pt: { x: number; y: number }) => ({
                x: cw - (pt.x * vw * s + ox),
                y: pt.y * vh * s + oy,
              });

              const p10 = toPx(lm[10]);
              const p152 = toPx(lm[152]);
              const p234 = toPx(lm[234]);
              const p454 = toPx(lm[454]);
              const p1 = toPx(lm[1]);
              const p33 = toPx(lm[33]);
              const p263 = toPx(lm[263]);

              // Tính toán mắt
              const e1 = lm.length >= 478 ? lm[468] : { x: (lm[33].x + lm[133].x) / 2, y: (lm[33].y + lm[133].y) / 2 };
              const e2 = lm.length >= 478 ? lm[473] : { x: (lm[263].x + lm[362].x) / 2, y: (lm[263].y + lm[362].y) / 2 };
              const pe1 = toPx(e1);
              const pe2 = toPx(e2);

              // Đảm bảo L luôn bên trái màn hình (x nhỏ hơn)
              const eyeL = pe1.x < pe2.x ? pe1 : pe2;
              const eyeR = pe1.x < pe2.x ? pe2 : pe1;
              const eyeMid = { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 };
              const eyeDist = Math.hypot(p33.x - p263.x, p33.y - p263.y);

              let rollEyes = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x);

              const faceVec = { x: p10.x - p152.x, y: p10.y - p152.y };
              const faceHeight = Math.hypot(faceVec.x, faceVec.y);
              const up = { x: faceVec.x / faceHeight, y: faceVec.y / faceHeight };
              const right = { x: -up.y, y: up.x };

              let rollHead = Math.atan2(up.x, -up.y);
              const headWidth = Math.hypot(p454.x - p234.x, p454.y - p234.y);

              const dL = Math.hypot(p1.x - p234.x, p1.y - p234.y);
              const dR = Math.hypot(p1.x - p454.x, p1.y - p454.y);
              const yaw = (dL - dR) / (dL + dR);
              const yawSqueeze = Math.max(0.55, Math.min(1, 1 - Math.abs(yaw) * 1.2));

              for (let i = 0; i < FACE_OVAL.length; i++) {
                targetPose.ovalPts[i] = toPx(lm[FACE_OVAL[i]]);
              }

              targetPose.p10 = p10;
              targetPose.p152 = p152;
              targetPose.p234 = p234;
              targetPose.p454 = p454;
              targetPose.p1 = p1;
              targetPose.eyeL = eyeL;
              targetPose.eyeR = eyeR;
              targetPose.eyeMid = eyeMid;
              targetPose.eyeDist = eyeDist;
              targetPose.headWidth = headWidth;
              targetPose.faceHeight = faceHeight;
              targetPose.up = up;
              targetPose.right = right;

              while (rollHead - targetPose.rollHead > Math.PI) rollHead -= 2 * Math.PI;
              while (rollHead - targetPose.rollHead < -Math.PI) rollHead += 2 * Math.PI;
              targetPose.rollHead = rollHead;

              while (rollEyes - targetPose.rollEyes > Math.PI) rollEyes -= 2 * Math.PI;
              while (rollEyes - targetPose.rollEyes < -Math.PI) rollEyes += 2 * Math.PI;
              targetPose.rollEyes = rollEyes;

              targetPose.yawSqueeze = yawSqueeze;

              targetPose.isVisible = true;
              lastFaceTime = now;
            } else {
              if (performance.now() - lastFaceTime > 200) {
                targetPose.isVisible = false;
              }
            }
          }

          const t = 0.35;
          const lerp = (a: number, b: number) => a + (b - a) * t;
          const lerpPt = (a: Point, b: Point) => ({ x: lerp(a.x, b.x), y: lerp(a.y, b.y) });

          if (!currentPose.isVisible && targetPose.isVisible) {
            Object.assign(currentPose, targetPose);
            for (let i = 0; i < FACE_OVAL.length; i++) {
              currentPose.ovalPts[i] = { ...targetPose.ovalPts[i] };
            }
          } else {
            currentPose.p10 = lerpPt(currentPose.p10, targetPose.p10);
            currentPose.p152 = lerpPt(currentPose.p152, targetPose.p152);
            currentPose.p234 = lerpPt(currentPose.p234, targetPose.p234);
            currentPose.p454 = lerpPt(currentPose.p454, targetPose.p454);
            currentPose.p1 = lerpPt(currentPose.p1, targetPose.p1);
            currentPose.eyeL = lerpPt(currentPose.eyeL, targetPose.eyeL);
            currentPose.eyeR = lerpPt(currentPose.eyeR, targetPose.eyeR);
            currentPose.eyeMid = lerpPt(currentPose.eyeMid, targetPose.eyeMid);
            currentPose.eyeDist = lerp(currentPose.eyeDist, targetPose.eyeDist);
            currentPose.headWidth = lerp(currentPose.headWidth, targetPose.headWidth);
            currentPose.faceHeight = lerp(currentPose.faceHeight, targetPose.faceHeight);
            currentPose.up = lerpPt(currentPose.up, targetPose.up);
            currentPose.right = lerpPt(currentPose.right, targetPose.right);
            currentPose.rollHead = lerp(currentPose.rollHead, targetPose.rollHead);
            currentPose.rollEyes = lerp(currentPose.rollEyes, targetPose.rollEyes);
            currentPose.yawSqueeze = lerp(currentPose.yawSqueeze, targetPose.yawSqueeze);
            for (let i = 0; i < FACE_OVAL.length; i++) {
              currentPose.ovalPts[i] = lerpPt(currentPose.ovalPts[i], targetPose.ovalPts[i]);
            }
          }
          currentPose.isVisible = targetPose.isVisible;

          Object.assign(sharedPose, currentPose);
        };
        loop();
      }
    }

    init();

      const currentVideo = videoRef.current;
      return () => {
        active = false;
        activeTrackers--;
        if (activeTrackers <= 0) {
          if (loopId !== null) {
            cancelAnimationFrame(loopId);
            loopId = null;
          }
          // Giữ nguyên landmarkerInstance và landmarkerPromise trong bộ nhớ
          // để không phải tải lại model nếu người dùng trang bị lại đồ hoặc chuyển trang.
        }
        notifyAILoading();

        if (currentVideo) {
          currentVideo.removeEventListener("loadedmetadata", updateDims);
          currentVideo.removeEventListener("playing", updateDims);
        }
        resizeObserver.disconnect();
      };
    }, [videoRef, containerRef]);

  return poseRef;
}

/**
 * Gọi khi người dùng BẤM chuyển sang trang có camera (bài học, tủ đồ...)
 * để model bắt đầu tải ngay trong lúc chuyển trang.
 * Người dùng đã tắt camera thì không tải.
 */
export function warmUpFaceModel() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem("inventory_camera_mode") === "off") return;
  } catch {
    // localStorage bị chặn thì vẫn tải như bình thường
  }
  void preloadFaceLandmarker()?.catch(() => undefined);
}
