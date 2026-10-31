"use client";

import React from "react";
import "./error-state.scss";

interface ErrorStateProps {
  error?: Error | { message?: string } | string | null;
  message?: string;
  onRetry?: () => void;
  /**
   * true: phủ kín toàn màn hình (chỉ dùng cho error boundary của route khi cả trang bị crash).
   * Mặc định false: hiển thị ngay tại ô dữ liệu bị lỗi, giữ nguyên cấu trúc trang.
   */
  fullScreen?: boolean;
  /** Bản thu nhỏ cho các ô/khung nhỏ (sidebar, tab, danh sách con). */
  compact?: boolean;
  /** Đang gọi lại API: khoá nút và xoay icon. */
  isRetrying?: boolean;
  retryText?: string;
  title?: string;
  className?: string;
}

function ErrorState({
  error,
  message,
  onRetry,
  fullScreen = false,
  compact = false,
  isRetrying = false,
  retryText,
  title = "Không thể tải dữ liệu",
  className = "",
}: ErrorStateProps) {
  const errorMessage =
    message ||
    (typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error && error.message
      ? error.message
      : "");

  const buttonText = retryText ?? (fullScreen ? "Tải lại trang" : "Thử lại");

  const handleRetry = () => {
    if (isRetrying) return;
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const rootClass = [
    "general-error-overlay",
    !fullScreen && "general-error-overlay--inline",
    compact && "general-error-overlay--compact",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} role="alert" aria-live="assertive">
      <div className="general-error-card">
        <div className="general-error-card__icon-box">
          <span className="general-error-card__icon">⚠️</span>
        </div>

        <h3 className="general-error-card__title">{title}</h3>

        <p className="general-error-card__message">
          {errorMessage || "Đã xảy ra sự cố khi tải dữ liệu. Vui lòng thử lại nhé!"}
        </p>

        <button
          type="button"
          onClick={handleRetry}
          className="general-error-card__btn"
          aria-label={buttonText}
          aria-busy={isRetrying}
          disabled={isRetrying}
        >
          <svg
            className={`general-error-card__btn-icon ${isRetrying ? "general-error-card__btn-icon--spin" : ""}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{isRetrying ? "Đang tải..." : buttonText}</span>
        </button>
      </div>
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
