"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { useRouter } from "next/navigation";
import { getReceivedInvitations } from "@/modules/friends/services/friends.service";
import { toast } from "@/components/ui/game-toast";
import { CoinIcon } from "@/components/ui/coin-icon";
import "./lessons-bottom-dock.scss";

export function LessonsBottomDock() {
  const router = useRouter();
  const { user } = useAuth();
  const coins = user?.coins ?? 0;
  const invitationsQuery = useQuery({
    queryKey: ["received-invitations-dock"],
    queryFn: getReceivedInvitations,
    enabled: !!user,
  });

  const invitationCount = invitationsQuery.data?.length ?? 0;

  const handleCoinsClick = () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để nhận xu điểm danh!");
      router.push("/login?next=/lessons");
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-daily-reward"));
    }
  };

  return (
    <>
      {/* SVG Defs chứa gradient vàng kim chuẩn cho tất cả icon */}
      <svg
        style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none", overflow: "hidden" }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="lessonsDockGoldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff8d9" />
            <stop offset="42%" stopColor="#ffdf85" />
            <stop offset="72%" stopColor="#e8a83d" />
            <stop offset="100%" stopColor="#a75b1f" />
          </linearGradient>
        </defs>
      </svg>

      <nav className="lessons-bottom-dock" aria-label="Menu trò chơi chính">
        <div className="lessons-dock__bar" role="toolbar" aria-label="Thanh menu">
          {/* 1. TỦ ĐỒ (Bên trái 1) */}
          <Link
            href="/inventory"
            className="lessons-dock__item lessons-dock__item--nav"
            data-label="Tủ Đồ"
            aria-label="Tủ đồ"
          >
            <span className="lessons-dock__icon" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path d="M8 13h32a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V15a2 2 0 0 1 2-2Zm0 0V9a2 2 0 0 1 2-2h28a2 2 0 0 1 2 2v4M6 24h36M21 21h6v6h-6z" />
              </svg>
            </span>
            <span className="lessons-dock__title">Tủ Đồ</span>
          </Link>

          {/* 2. CỬA HÀNG (Bên trái 2) */}
          <Link
            href="/gio-hang"
            className="lessons-dock__item lessons-dock__item--nav"
            data-label="Cửa Hàng"
            aria-label="Cửa hàng vật phẩm"
          >
            <span className="lessons-dock__icon" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path d="M4 8h6l5.2 22.2a3 3 0 0 0 3 2.3h18.2a3 3 0 0 0 2.9-2.2L43 15H12M18 41a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm18 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
            </span>
            <span className="lessons-dock__title">Cửa Hàng</span>
          </Link>

          {/* 3. Ở GIỮA: KHUNG LÕM TỔNG SỐ XU */}
          <div
            className="lessons-dock__item lessons-dock__item--coins"
            aria-label={`Tổng số xu: ${coins.toLocaleString("vi-VN")}`}
            title={`Tổng số xu: ${coins.toLocaleString("vi-VN")} - Bấm để nhận xu`}
            role="button"
            tabIndex={0}
            onClick={handleCoinsClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCoinsClick();
              }
            }}
          >
            <div className="lessons-dock__coin-slot">
              <span className="lessons-dock__coin-icon" aria-hidden="true">
                <CoinIcon size="100%" />
              </span>
              <span className="lessons-dock__coin-value">{coins.toLocaleString("vi-VN")}</span>
            </div>
          </div>

          {/* 4. BẠN BÈ (Bên phải 1) */}
          <Link
            href="/ban-be"
            className="lessons-dock__item lessons-dock__item--nav"
            data-label="Bạn Bè"
            aria-label="Bạn bè"
          >
            {invitationCount > 0 && (
              <span className="lessons-dock__badge" aria-label={`${invitationCount} lời mời`}>
                {invitationCount > 99 ? "99+" : invitationCount}
              </span>
            )}
            <span className="lessons-dock__icon" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path d="M17 21a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm14 2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM7 39v-3a8 8 0 0 1 16 0v3m8 0v-2.5a7 7 0 0 0-5.5-6.8M39 39v-2a7 7 0 0 0-5.5-6.8" />
              </svg>
            </span>
            <span className="lessons-dock__title">Bạn Bè</span>
          </Link>

          {/* 5. TRANG CÁ NHÂN (Bên phải 2) */}
          <Link
            href="/profile"
            className="lessons-dock__item lessons-dock__item--nav"
            data-label="Trang Cá Nhân"
            aria-label="Trang cá nhân"
          >
            <span className="lessons-dock__icon" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path d="M24 7a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17ZM11 40v-3.5a13 13 0 0 1 26 0V40H11Z" />
              </svg>
            </span>
            <span className="lessons-dock__title">Cá Nhân</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
