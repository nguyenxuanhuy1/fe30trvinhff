"use client";

import React, { useId } from "react";
import "./coin-icon.scss";

export interface CoinIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  color?: string;
}

/**
 * Icon xu vàng game 3D đồng bộ toàn hệ thống.
 * Sử dụng SVG gradient vàng kim với viền nét gỗ sắc nét, không bị ngược chữ $.
 */
export function CoinIcon({ className, style, size = 18 }: CoinIconProps) {
  const rawId = useId();
  const gradId = "coin_grad_" + rawId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const numSize = typeof size === "number" ? `${size}px` : size;

  return (
    <span
      className={`coin-icon-gold ${className ?? ""}`.trim()}
      style={{
        width: numSize,
        height: numSize,
        ...style,
      }}
      role="img"
      aria-label="Xu"
    >
      <svg
        viewBox="0 0 48 48"
        width="100%"
        height="100%"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff8d9" />
            <stop offset="42%" stopColor="#ffdf85" />
            <stop offset="72%" stopColor="#e8a83d" />
            <stop offset="100%" stopColor="#a75b1f" />
          </linearGradient>
        </defs>

        {/* 1. Vành ngoài đồng xu */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill={`url(#${gradId})`}
          stroke="#42220f"
          strokeWidth="2.4"
        />

        {/* 2. Vành tròn chìm bên trong */}
        <circle
          cx="24"
          cy="24"
          r="15"
          fill="none"
          stroke="#543320"
          strokeWidth="1.5"
          opacity="0.8"
        />

        {/* 3. Nét trục đứng chữ $ */}
        <line
          x1="24"
          y1="12"
          x2="24"
          y2="36"
          stroke="#42220f"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* 4. Nét chữ S đúng chiều chuẩn không bị ngược */}
        <path
          d="M29 19.5c-.9-2-2.4-2.8-5-2.8-3 0-5 1.6-5 4 0 2.8 2.2 3.8 5 4.5 2.8.7 5 1.8 5 4.8 0 2.8-2.2 4.5-5 4.5-2.5 0-4.2-1-5.2-3"
          fill="none"
          stroke="#42220f"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
