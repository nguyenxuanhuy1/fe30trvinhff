"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./lessons-back-button.scss";

interface LessonsBackButtonProps {
  href?: string;
  onBack?: () => void;
}

export function LessonsBackButton({ href = "/", onBack }: LessonsBackButtonProps) {
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
      className="lessons-back-btn"
      aria-label="Quay lại"
    >
      <svg
        className="lessons-back-btn__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span className="lessons-back-btn__text">QUAY LẠI</span>
    </Link>
  );
}
