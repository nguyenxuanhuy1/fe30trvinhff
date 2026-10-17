"use client";

import { Alert, Button, Space, Tag } from "antd";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { inventoryView, slotLabels } from "../../inventory.const";
import { SLOT_DEFAULTS } from "../../item-slots";
import type { CatalogItem } from "../../types";
import "./camera-preview.scss";

interface CameraPreviewApi {
  /** Nhả camera ngay, dùng trước khi nhảng iframe cho bài thí nghiệm mở camera */
  release: () => void;
}

interface CameraPreviewProps {
  /** đồ đang mặc, vẽ dè lên người trong camera */
  equippedItems: CatalogItem[];
  apiRef?: Ref<CameraPreviewApi | null>;
}

type CameraState = "idle" | "starting" | "ready" | "denied" | "error";

// Toạ độ chuẩn của MediaPipe Face Mesh, chỉ cần vài điểm để dựng khung đầu.
const FACE = {
  foreheadTop: 10,
  cheekA: 234,
  cheekB: 454,
} as const;

/**
 * Camera thật + đồ vẽ đè lên người, dùng để thử đồ trước khi vào thí nghiệm.
 *
 * Không dùng PoseLandmarker vì bài thí nghiệm hiện cũng chỉ có face + hand:
 * đồ neo HEAD đặt theo khung đầu, đồ neo BODY suy ra từ cằm xuống thân.
 */
function CameraPreview({ equippedItems, apiRef }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<CatalogItem[]>(equippedItems);
  const openSessionRef = useRef(0);
  const [state, setState] = useState<CameraState>("idle");
  const [detail, setDetail] = useState("");
  const [tracking, setTracking] = useState(false);

  // Vẽ trong vòng lặp không cần render lại, đọc đồ qua ref để tránh đóng
  // lại landmarker mỗi lần người dùng đổi đồ
  useEffect(() => {
    itemsRef.current = equippedItems;
  }, [equippedItems]);

  const stop = useCallback(() => {
    // Vô hiệu hoá phiên đang chạy để lần start sau không dùng lại landmarker cũ
    openSessionRef.current += 1;
    const video = videoRef.current;
    if (video?.srcObject) {
      for (const track of (video.srcObject as MediaStream).getTracks()) {
        track.stop();
      }
      video.srcObject = null;
    }
  }, []);

  useImperativeHandle(apiRef, () => ({ release: stop }), [stop]);

  useEffect(() => {
    let disposed = false;
    let landmarker: FaceLandmarkerInstance | null = null;
    let frame = 0;
    let stream: MediaStream | null = null;
    let sawFace = false;
    // StrictMode mount 2 lần nên effect chạy cả mount và remount. Không có
    // chốt này thì getUserMedia chạy 2 lần, giữ 2 stream cùng lúc và làm bài
    // thí nghiệm bên dưới không lấy được camera.
    const sessionId = ++openSessionRef.current;

    async function start() {
      setState("starting");
      setDetail("");

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Trình duyệt chỉ cho phép bật Camera qua HTTPS hoặc localhost.");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });

        if (disposed || openSessionRef.current !== sessionId) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        if (disposed) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        const playPromise = async () => {
          try {
            await video.play();
          } catch {
            video.oncanplay = () => {
              if (!disposed) video.play().catch(() => undefined);
            };
          }
        };
        if (video.readyState >= 1) {
          void playPromise();
        } else {
          video.onloadedmetadata = () => void playPromise();
        }

        // Nạp ở runtime bằng biến, không dùng import tĩnh: "/vendor/..." là
        // đường dẫn static trong public/ mà bundler không phân giải được, nếu
        // viết thẳng vào import() thì build sẽ lỗi không tìm thấy module.
        const visionUrl = "/vendor/tasks-vision/vision_bundle.mjs";
        const { FilesetResolver, FaceLandmarker } =
          (await import(/* webpackIgnore: true */ visionUrl)) as VisionBundle;
        const fileset = await FilesetResolver.forVisionTasks("/vendor/tasks-vision/wasm");
        const created = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: "/models/face_landmarker.task", delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });

        if (disposed) {
          created.close();
          return;
        }

        landmarker = created;
        setState("ready");

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        function loop() {
          frame = requestAnimationFrame(loop);

          if (!video || video.readyState < 2 || !ctx || !canvas || !landmarker) {
            return;
          }

          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width === 0 || height === 0) return;

          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          ctx.clearRect(0, 0, width, height);

          let face: Array<{ x: number; y: number }> | null = null;
          try {
            const result = landmarker!.detectForVideo(video, performance.now());
            face = result.faceLandmarks?.[0] ?? null;
          } catch {
            // Một frame hỏng không được làm đứng cả vòng lặp
            return;
          }

          // Chỉ setState khi trạng thái đổi, gọi mỗi frame sẽ render lại 60 lần/giây
          const seen = Boolean(face);
          if (seen !== sawFace) {
            sawFace = seen;
            setTracking(seen);
          }

          if (face) {
            // Landmark chuẩn hoá 0..1, nhân lại kích thước canvas
            const points = face.map((p) => ({ x: p.x * width, y: p.y * height }));
            drawItems(ctx, itemsRef.current, points);
          }
        }

        loop();
      } catch (error) {
        if (disposed) return;

        const name = (error as { name?: string })?.name ?? "";

        if (name === "NotAllowedError" || name === "SecurityError") {
          setState("denied");
          setDetail("Bạn đã từ chối quyền dùng camera.");
          return;
        }

        setState("error");
        setDetail(
          (error as { message?: string })?.message ||
            "Không mở được camera. Kiểm tra thiết bị có camera không.",
        );
      }
    }

    void start();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      landmarker?.close();
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
    };
  }, [stop]);

  const items = equippedItems;

  return (
    <section className="camera-preview" aria-label={inventoryView.previewHint}>
      <header className="camera-preview__header">
        <h3 className="camera-preview__title">{inventoryView.equippedTitle}</h3>
        {state === "ready" && (
          <Tag color={tracking ? "green" : "orange"}>
            {tracking ? "Đang thấy bạn" : "Hãy nhìn vào camera"}
          </Tag>
        )}
      </header>

      <div className="camera-preview__stage">
        <video className="camera-preview__video" ref={videoRef} autoPlay playsInline muted />
        <canvas className="camera-preview__canvas" ref={canvasRef} />

        {state !== "ready" && (
          <div className="camera-preview__overlay">
            {state === "starting" ? (
              <p className="camera-preview__hint">Đang mở camera...</p>
            ) : state === "denied" ? (
              <>
                <Alert type="warning" showIcon title={detail} />
                <Button onClick={() => window.location.reload()}>Cho phép lại</Button>
              </>
            ) : state === "error" ? (
              <Alert type="error" showIcon title={detail} />
            ) : (
              <Space orientation="vertical">
                <p className="camera-preview__hint">{inventoryView.previewHint}</p>
                <Button type="primary" onClick={() => window.location.reload()}>
                  Mở camera để thử đồ
                </Button>
              </Space>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="camera-preview__empty">{inventoryView.previewEmpty}</p>
      ) : (
        <ul className="camera-preview__list">
          {items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <Tag>{slotLabels[item.slot] ?? item.slot}</Tag>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawItems(
  ctx: CanvasRenderingContext2D,
  items: CatalogItem[],
  face: Array<{ x: number; y: number }>,
) {
  const top = face[FACE.foreheadTop];
  const cheekA = face[FACE.cheekA];
  const cheekB = face[FACE.cheekB];

  if (!top || !cheekA || !cheekB) return;

  const faceWidth = distance(cheekA, cheekB);
  if (!faceWidth) return;

  const angle = Math.atan2(cheekB.y - cheekA.y, cheekB.x - cheekA.x);

  for (const item of items) {
    const image = loadPreviewImage(item.imageUrl);
    const defaults = SLOT_DEFAULTS[item.slot];
    if (!image || !defaults) continue;

    let box;

    if (defaults.anchor === "HEAD") {
      const size = faceWidth * 1.15 * item.scale;
      box = {
        centerX: top.x + item.offsetX * size * 0.1,
        centerY: top.y - size * 0.42 + item.offsetY * size * 0.1,
        size,
        angle,
      };
    } else {
      // Ước lượng thân từ bề rộng đầu: cao người ~5.2 lần, đo từ đỉnh đầu xuống
      const personHeight = faceWidth * 5.2;
      const shoulderY = top.y + faceWidth * 0.5;
      const size =
        (item.slot === "trousers" ? faceWidth * 2.1 : faceWidth * 1.9) * item.scale;
      box = {
        centerX: top.x + item.offsetX * size * 0.1,
        centerY:
          shoulderY + personHeight * (defaults.top / 100) + item.offsetY * size * 0.1,
        size,
        angle,
      };
    }

    ctx.save();
    ctx.translate(box.centerX, box.centerY);
    ctx.rotate(box.angle);
    ctx.drawImage(image, -box.size / 2, -box.size / 2, box.size, box.size);
    ctx.restore();
  }
}

// Cache ảnh để vẽ mỗi frame không tạo Image mới liên tục
const imageCache = new Map<string, HTMLImageElement>();

function loadPreviewImage(url: string): HTMLImageElement | null {
  const cached = imageCache.get(url);
  if (cached) {
    return cached.naturalWidth > 0 ? cached : null;
  }

  const image = new Image();
  image.decoding = "async";
  image.src = url;
  imageCache.set(url, image);

  return null;
}

export { CameraPreview };
export type { CameraPreviewApi, CameraPreviewProps };
