"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  enterFullscreenAndLockLandscape,
  exitFullscreenAndUnlock,
  isFullscreenActive,
} from "@/utils";
import "./ExitFullscreenButton.scss";

export interface ExitFullscreenButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ExitFullscreenButton: React.FC<ExitFullscreenButtonProps> = ({
  className,
  style,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsFullscreen(isFullscreenActive());

    const handleFullscreenChange = () => {
      setIsFullscreen(isFullscreenActive());
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    window.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("fullscreen-toggle", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("fullscreen-toggle", handleFullscreenChange);
    };
  }, []);

  const handleClick = async () => {
    if (isFullscreenActive()) {
      await exitFullscreenAndUnlock();
    } else {
      await enterFullscreenAndLockLandscape();
    }
    setIsFullscreen(isFullscreenActive());
  };

  const buttonElement = (
    <button
      type="button"
      className={`exit-fs-btn ${className ?? ""}`}
      style={style}
      onClick={handleClick}
      title={isFullscreen ? "Thoát toàn màn hình (ESC)" : "Bật toàn màn hình"}
      aria-label={isFullscreen ? "Thoát toàn màn hình" : "Bật toàn màn hình"}
    >
      {isFullscreen ? (
        // Icon Thu nhỏ / Thoát Fullscreen (Compress/Contract)
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="exit-fs-btn__icon"
          aria-hidden="true"
        >
          <path d="M4 14h6v6" />
          <path d="M10 14L3 21" />
          <path d="M20 10h-6V4" />
          <path d="M14 10l7-7" />
          <path d="M14 20v-6h6" />
          <path d="M14 14l7 7" />
          <path d="M10 4v6H4" />
          <path d="M10 10L3 3" />
        </svg>
      ) : (
        // Icon Phóng to / Vào Fullscreen (Expand)
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="exit-fs-btn__icon"
          aria-hidden="true"
        >
          <path d="M15 3h6v6" />
          <path d="M21 3l-7 7" />
          <path d="M9 21H3v-6" />
          <path d="M3 21l7-7" />
          <path d="M21 15v6h-6" />
          <path d="M21 21l-7-7" />
          <path d="M3 9V3h6" />
          <path d="M3 3l7 7" />
        </svg>
      )}
    </button>
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(buttonElement, document.body);
};
