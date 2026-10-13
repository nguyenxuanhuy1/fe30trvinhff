"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./CornerBackButton.scss";

export interface CornerBackButtonProps {
  href?: string;
  label?: string;
  onBack?: () => void;
}

export const CornerBackButton: React.FC<CornerBackButtonProps> = ({
  href = "/",
  label = "Quay lại",
  onBack,
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (onBack) {
      e.preventDefault();
      onBack();
    } else if (href) {
      e.preventDefault();
      router.push(href);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="corner-back-tab"
      aria-label={label}
    >
      <div className="corner-back-tab__bg">
        <svg
          viewBox="0 0 200 50"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="corner-back-tab__svg"
        >
          <defs>
            <linearGradient id="backBtnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--back-btn-light)" />
              <stop offset="100%" stopColor="var(--back-btn-color)" />
            </linearGradient>
            <linearGradient id="backBtnHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.65" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <clipPath id="backBtnClip">
              <path d="M0 0 L0 48 L130 48 C164 48 166 0 200 0 Z" />
            </clipPath>
          </defs>

          {/* Lớp sẫm 3D (vẽ trước) */}
          <path d="M0 0 L0 50 L130 50 C164 50 168 2 202 0 Z" fill="#c26500" />

          {/* Lớp nền chính */}
          <path d="M0 0 L0 48 L130 48 C164 48 166 0 200 0 Z" fill="url(#backBtnGrad)" />

          {/* Lớp bóng highlight nửa trên (glossy) */}
          <path
            d="M0 0 L0 24 L130 24 C164 24 166 0 200 0 Z"
            fill="url(#backBtnHighlight)"
            clipPath="url(#backBtnClip)"
          />

          {/* Viền sáng */}
          <path
            d="M0 0 L0 48 L130 48 C164 48 166 0 200 0 Z"
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />
        </svg>

        {/* Chấm sáng tạo điểm nhấn góc trên */}
        <div className="corner-back-tab__flare"></div>
      </div>

      <div className="corner-back-tab__content">
        <svg
          className="corner-back-tab__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        <span className="corner-back-tab__label">{label}</span>
      </div>
    </Link>
  );
};
