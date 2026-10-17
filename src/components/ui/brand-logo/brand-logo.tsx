"use client";

import type { FC } from "react";
import "./brand-logo.scss";

export interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "responsive";
}

// Chữ STEAMaze đúng định dạng (STEAM viết hoa, aze viết thường)
// Đường cong vòm tròn rõ nét, tỷ lệ theo 'em' để tự co giãn khi chữ to nhỏ
const LOGO_LETTERS = [
  { char: "S", rot: -21, y: "0.32em" },
  { char: "T", rot: -14, y: "0.16em" },
  { char: "E", rot: -7, y: "0.05em" },
  { char: "A", rot: -2, y: "-0.02em" },
  { char: "M", rot: 3, y: "-0.02em" },
  { char: "a", rot: 9, y: "0.06em" },
  { char: "z", rot: 16, y: "0.18em" },
  { char: "e", rot: 22, y: "0.32em" },
];

export const BrandLogo: FC<BrandLogoProps> = ({
  className = "",
  size = "responsive",
}) => {
  return (
    <span
      className={`brand-logo brand-logo--${size} ${className}`.trim()}
      aria-label="STEAMaze"
      role="img"
    >
      <span className="brand-logo__wrapper" aria-hidden="true">
        {LOGO_LETTERS.map((item, index) => (
          <span
            key={index}
            className={`brand-logo__letter brand-logo__letter--${index >= 5 ? "lower" : "upper"}`}
            style={
              {
                "--rot": `${item.rot}deg`,
                "--y": item.y,
              } as React.CSSProperties
            }
          >
            {item.char}
          </span>
        ))}
      </span>
    </span>
  );
};
