"use client";

import { useEffect, useRef, useState } from "react";

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
let landmarkerPromise: Promise<any> | null = null;
let landmarkerInstance: any = null;
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

export function preloadFaceLandmarker(): Promise<any> | null {
  if (typeof window === "undefined") return null;

  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        const vision = await FilesetResolver.forVisionTasks(
          "/vendor/tasks-vision/wasm"
        );
        try {
          return await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "/models/face_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          });
        } catch (e) {
          console.warn("GPU failed, falling back to CPU", e);
          return await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "/models/face_landmarker.task",
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
          });
        }
      } catch (err) {
        console.error("Lỗi khi tải FaceLandmarker:", err);
        landmarkerPromise = null;
        throw err;
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
          if (!video || video.readyState < 2) return;

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
        }
        resizeObserver.disconnect();
      };
    }, [videoRef, containerRef]);

  return poseRef;
}
