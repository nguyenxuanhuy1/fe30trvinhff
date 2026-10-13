// MediaPipe Tasks Vision được serve từ public/vendor, không phải package npm
// nên TypeScript không tìm được type. Sảnh chờ nạp bằng import() động với biến
// chứa đường dẫn (bundler không phân giải được đường dẫn static trong public/),
// nên khai báo shape của bundle thay vì khai báo module.
//
// Chỉ khai báo phần dùng: FaceLandmarker là đủ để gắn đồ lên đầu/thân.

declare global {
  interface VisionLandmark {
    x: number;
    y: number;
    z: number;
  }

  interface FaceLandmarkerResult {
    faceLandmarks?: VisionLandmark[][];
  }

  interface FaceLandmarkerInstance {
    detectForVideo(video: HTMLVideoElement, timestampMs: number): FaceLandmarkerResult;
    close(): void;
  }

  interface FaceLandmarkerOptions {
    baseOptions: {
      modelAssetPath: string;
      delegate?: "GPU" | "CPU";
    };
    runningMode: "VIDEO" | "IMAGE";
    numFaces?: number;
  }

  interface VisionBundle {
    FilesetResolver: {
      forVisionTasks(wasmPath: string): Promise<unknown>;
    };
    FaceLandmarker: {
      createFromOptions(
        fileset: unknown,
        options: FaceLandmarkerOptions,
      ): Promise<FaceLandmarkerInstance>;
    };
  }
}

export {};
