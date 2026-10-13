"use client";

import { useEffect, useState } from "react";
import { getCroppedItem, type CroppedItemResult } from "../utils/crop-item";
import type { CatalogItem } from "../types";

interface StaticSvgAccessoryProps {
  slot: string;
  item: CatalogItem;
}

export function StaticSvgAccessory({ slot, item }: StaticSvgAccessoryProps) {
  const [cropped, setCropped] = useState<CroppedItemResult | null>(null);

  useEffect(() => {
    let active = true;
    getCroppedItem(item.imageUrl).then((res) => {
      if (active) {
        setCropped(res);
      }
    });
    return () => {
      active = false;
    };
  }, [item.imageUrl]);

  if (!cropped || cropped.width <= 0 || cropped.height <= 0) {
    return null;
  }

  const aspect = cropped.height / cropped.width;

  if (slot === "hat") {
    // Quy chuẩn: đáy mũ tại (512, 245), bề rộng ~320, đè lên mép trên lỗ ~25px, che túm lông đỉnh đầu
    const targetWidth = 320;
    const targetHeight = targetWidth * aspect;
    const x = 512 - targetWidth / 2;
    const y = 245 - targetHeight;

    return (
      <image
        href={cropped.url}
        x={x}
        y={y}
        width={targetWidth}
        height={targetHeight}
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: "pixelated" }}
      />
    );
  }

  if (slot === "glasses") {
    // Quy chuẩn: tâm (512, 382), bề rộng ~300, nằm trên mặt user, chỉ để vừa trong lỗ
    const targetWidth = 300;
    const targetHeight = targetWidth * aspect;
    const x = 512 - targetWidth / 2;
    const y = 382 - targetHeight / 2;

    return (
      <image
        href={cropped.url}
        x={x}
        y={y}
        width={targetWidth}
        height={targetHeight}
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: "pixelated" }}
      />
    );
  }

  if (slot === "mask") {
    // Mặt nạ che trên mặt: tâm (512, 397), bề rộng ~320
    const targetWidth = 320;
    const targetHeight = targetWidth * aspect;
    const x = 512 - targetWidth / 2;
    const y = 397 - targetHeight / 2;

    return (
      <image
        href={cropped.url}
        x={x}
        y={y}
        width={targetWidth}
        height={targetHeight}
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: "pixelated" }}
      />
    );
  }

  return null;
}
