"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './CornerInventoryButton.scss';

const ROUTE_INVENTORY = '/inventory';

export const CornerInventoryButton = () => {
  const pathname = usePathname();

  // Không hiển thị nút nếu đang ở trang tủ đồ
  if (pathname === ROUTE_INVENTORY) {
    return null;
  }

  return (
    <Link href={ROUTE_INVENTORY} className="inventory-tab" aria-label="Mở tủ đồ">
      <div className="inventory-tab__bg">
        <svg
          viewBox="0 0 200 50"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="inventory-tab__svg"
        >
          <defs>
            <linearGradient id="invBtnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--inventory-btn-light)" />
              <stop offset="100%" stopColor="var(--inventory-btn-color)" />
            </linearGradient>
            <linearGradient id="invBtnHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.65" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <clipPath id="invBtnClip">
              <path d="M0 0 C34 0 36 48 70 48 L200 48 L200 0 Z" />
            </clipPath>
          </defs>

          {/* Lớp sẫm 3D (vẽ trước) */}
          <path d="M-2 0 C32 2 36 50 70 50 L200 50 L200 0 Z" fill="#c26500" />

          {/* Lớp nền chính */}
          <path d="M0 0 C34 0 36 48 70 48 L200 48 L200 0 Z" fill="url(#invBtnGrad)" />

          {/* Lớp bóng highlight nửa trên (glossy) */}
          <path d="M0 0 C34 0 36 24 70 24 L200 24 L200 0 Z" fill="url(#invBtnHighlight)" clipPath="url(#invBtnClip)" />

          {/* Viền sáng */}
          <path d="M0 0 C34 0 36 48 70 48 L200 48 L200 0 Z" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        </svg>

        {/* Chấm sáng tạo điểm nhấn góc trên */}
        <div className="inventory-tab__flare"></div>
      </div>

      <div className="inventory-tab__content">
        <svg
          className="inventory-tab__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        <span className="inventory-tab__label">Mở tủ đồ</span>
      </div>
    </Link>
  );
};
