"use client";

import React from "react";
import "./error-state.scss";

interface ErrorStateProps {
  error?: Error | { message?: string } | string | null;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  retryText?: string;
}

function ErrorState({
  error,
  message,
  onRetry,
  fullScreen = true,
  retryText = "Tải lại trang",
}: ErrorStateProps) {
  const errorMessage =
    message ||
    (typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error && error.message
      ? error.message
      : "");

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const rootClass = fullScreen
    ? "general-error-overlay"
    : "general-error-overlay general-error-overlay--inline";

  return (
    <div className={rootClass} role="alert" aria-live="assertive">
      <div className="general-error-card">
        <div className="general-error-card__icon-box">
          <span className="general-error-card__icon">⚠️</span>
        </div>

        <h3 className="general-error-card__title">Không thể tải dữ liệu</h3>

        <p className="general-error-card__message">
          {errorMessage || "Đã xảy ra sự cố khi tải dữ liệu. Vui lòng thử tải lại trang nhé!"}
        </p>

        <button
          type="button"
          onClick={handleRetry}
          className="general-error-card__btn"
          aria-label={retryText}
        >
          <svg
            className="general-error-card__btn-icon"
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
          <span>{retryText}</span>
        </button>
      </div>
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };
