"use client";

import React from "react";
import "./coin-icon.scss";

export interface CoinIconProps {
  className?: string;
  style?: React.CSSProperties;
  /** Kích thước icon: số (px) hoặc chuỗi CSS ("100%", "1.2em"...) */
  size?: number | string;
  /** Màu chữ $ (mặc định nâu gỗ cùng tông giao diện) */
  color?: string;
}

/**
 * Icon xu vàng dùng chung toàn web.
 * Vẽ hoàn toàn bằng CSS (xem coin-icon.scss): đồng xu vàng, viền gỗ nâu, chữ $ font game.
 * Chữ $ tự co giãn theo kích thước đồng xu nên dùng được ở mọi cỡ.
 */
export function CoinIcon({ className, style, size = 18, color }: CoinIconProps) {
  const cssSize = typeof size === "number" ? `${size}px` : size;

  return (
    <span
      className={`coin-icon-gold ${className ?? ""}`.trim()}
      style={
        {
          width: cssSize,
          height: cssSize,
          ...(color ? { "--coin-symbol-color": color } : {}),
          ...style,
        } as React.CSSProperties
      }
      role="img"
      aria-label="Xu"
    >
      <span className="coin-icon-gold__face" aria-hidden="true">
        <span className="coin-icon-gold__symbol">$</span>
      </span>
    </span>
  );
}
