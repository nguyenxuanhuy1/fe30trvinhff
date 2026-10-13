import React from "react";
import { DollarCircleFilled } from "@ant-design/icons";
import "./coin-icon.scss";

export interface CoinIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
  color?: string;
}

/**
 * Icon xu vàng chuẩn Ant Design cho toàn bộ hệ thống
 */
export function CoinIcon({ className, style, size, color }: CoinIconProps) {
  const mergedStyle: React.CSSProperties = {
    color: color || "#f59e0b",
    fontSize: size || "inherit",
    ...style,
  };

  return (
    <DollarCircleFilled
      className={`coin-icon-gold ${className ?? ""}`.trim()}
      style={mergedStyle}
      aria-label="Xu"
    />
  );
}
