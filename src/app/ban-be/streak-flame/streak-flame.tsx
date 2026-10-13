import React from "react";
import "./streak-flame.scss";

interface StreakFlameProps {
  size?: "sm" | "md" | "lg";
  days?: number;
  showDetails?: boolean;
  variant?: "fire" | "ice";
}

export function StreakFlame({
  size = "md",
  days = 1,
  showDetails = false,
  variant = "fire",
}: StreakFlameProps) {
  const isIce = variant === "ice";

  return (
    <div
      className={`streak-flame-widget streak-flame-widget--${size} ${
        isIce ? "streak-flame-widget--ice" : "streak-flame-widget--fire"
      }`}
    >
      <div className="streak-flame-widget__visual">
        <svg
          className="streak-flame-widget__svg"
          viewBox="0 0 100 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* LỬA (FIRE) */}
            <linearGradient id="flameOuterGrad" x1="50" y1="120" x2="50" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8a1805" />
              <stop offset="35%" stopColor="#e84118" />
              <stop offset="70%" stopColor="#f39c12" />
              <stop offset="100%" stopColor="#f1c40f" />
            </linearGradient>
            <linearGradient id="flameInnerGrad" x1="50" y1="110" x2="50" y2="35" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e67e22" />
              <stop offset="60%" stopColor="#f1c40f" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            {/* BĂNG (ICE) */}
            <linearGradient id="iceOuterGrad" x1="50" y1="120" x2="50" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0984e3" />
              <stop offset="35%" stopColor="#00cec9" />
              <stop offset="70%" stopColor="#74b9ff" />
              <stop offset="100%" stopColor="#dff9fb" />
            </linearGradient>
            <linearGradient id="iceInnerGrad" x1="50" y1="110" x2="50" y2="35" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00cec9" />
              <stop offset="60%" stopColor="#81ecec" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <filter id="flameGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="iceGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ánh hào quang nền */}
          <circle
            cx="50"
            cy="70"
            r="38"
            fill={isIce ? "rgba(0, 206, 201, 0.25)" : "rgba(243, 156, 18, 0.2)"}
            filter={isIce ? "url(#iceGlow)" : "url(#flameGlow)"}
          />

          {/* Vỏ ngọn lửa/băng ngoài */}
          <path
            className="streak-flame-widget__path-outer"
            d="M50 10C50 10 58 35 72 45C86 55 90 70 85 88C80 106 65 118 50 118C35 118 20 106 15 88C10 70 14 55 28 45C42 35 50 10 50 10Z"
            fill={isIce ? "url(#iceOuterGrad)" : "url(#flameOuterGrad)"}
          />

          {/* Lưỡi lửa/băng phụ trái */}
          <path
            className="streak-flame-widget__path-left"
            d="M38 52C38 52 26 62 26 78C26 94 36 106 50 110C35 106 28 92 30 80C32 68 38 52 38 52Z"
            fill={isIce ? "#0984e3" : "#d35400"}
            opacity="0.8"
          />

          {/* Lưỡi lửa/băng phụ phải */}
          <path
            className="streak-flame-widget__path-right"
            d="M62 52C62 52 74 62 74 78C74 94 64 106 50 110C65 106 72 92 70 80C68 68 62 52 62 52Z"
            fill={isIce ? "#74b9ff" : "#e67e22"}
            opacity="0.8"
          />

          {/* Lõi ngọn lửa/băng sáng bên trong */}
          <path
            className="streak-flame-widget__path-inner"
            d="M50 42C50 42 56 58 64 68C72 78 70 94 62 104C55 110 50 110 50 110C50 110 45 110 38 104C30 94 28 78 36 68C44 58 50 42 50 42Z"
            fill={isIce ? "url(#iceInnerGrad)" : "url(#flameInnerGrad)"}
          />

          {/* Tia phát sáng tâm */}
          <ellipse
            cx="50"
            cy="85"
            rx="9"
            ry="16"
            fill="#ffffff"
            opacity="0.95"
            filter={isIce ? "url(#iceGlow)" : "url(#flameGlow)"}
          />
        </svg>
      </div>

      {showDetails && (
        <div className="streak-flame-widget__info">
          <div className="streak-flame-widget__badge">
            <span className="streak-flame-widget__badge-icon">{isIce ? "🧊" : "🔥"}</span>
            <span className="streak-flame-widget__badge-text">
              {isIce ? "CHUỖI BỊ ĐÓNG BĂNG" : `${days} NGÀY CHUỖI`}
            </span>
          </div>
          <span className="streak-flame-widget__status">
            {isIce ? "Cần tất cả thành viên đăng nhập" : "Đang duy trì chuỗi"}
          </span>
        </div>
      )}
    </div>
  );
}
