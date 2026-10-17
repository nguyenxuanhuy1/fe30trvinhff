"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GiftOutlined } from "@ant-design/icons";
import { useAuth } from "@/modules/auth";
import { DailyRewardModal } from "@/modules/rewards";
import { authHeader } from "./auth-header.const";
import "./auth-header.scss";

const AVATAR_FALLBACK = "/images/chuotuser.webp";
// Chờ một chút trước khi đóng để chuột kịp đi từ nút xuống menu
const CLOSE_DELAY = 150;

interface AuthHeaderProps {
  /** Đặt trong menu di động: hiển thị như mục cấp 1 có menu con thụt lề */
  inMenu?: boolean;
  /** Ẩn mục Trang cá nhân (dành cho landing page) */
  hideProfileLink?: boolean;
}

function AuthHeader({ inMenu = false, hideProfileLink = false }: AuthHeaderProps) {
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setIsMenuOpen(true);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(
    (delay = 0) => {
      clearCloseTimer();
      if (delay === 0) {
        setIsMenuOpen(false);
        return;
      }
      closeTimerRef.current = setTimeout(() => {
        setIsMenuOpen(false);
        closeTimerRef.current = null;
      }, delay);
    },
    [clearCloseTimer],
  );

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, closeMenu]);

  if (isLoading) {
    return <div className="auth-header__loading" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        className={`auth-header__login-button${inMenu ? " auth-header__login-button--menu" : ""}`}
        href="/login"
      >
        {authHeader.loginLabel}
      </Link>
    );
  }

  const avatarSrc = user.avatarUrl ?? AVATAR_FALLBACK;

  return (
    <div
      className={`auth-header__profile${inMenu ? " auth-header__profile--menu" : ""}`}
      ref={menuRef}
      onMouseEnter={inMenu ? undefined : () => openMenu()}
      onMouseLeave={inMenu ? undefined : () => closeMenu(CLOSE_DELAY)}
    >
      <button
        className="auth-header__trigger"
        type="button"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={() => (isMenuOpen ? closeMenu() : openMenu())}
      >
        <span className="auth-header__avatar">
          <Image
            className="auth-header__avatar-image"
            src={avatarSrc}
            alt={`Avatar của ${user.username}`}
            width={32}
            height={32}
          />
        </span>
        <span className="auth-header__username">{user.username}</span>
        <span className="auth-header__chevron" aria-hidden="true" />
      </button>

      <div
        className={`auth-header__dropdown${isMenuOpen ? " auth-header__dropdown--open" : ""}${inMenu ? " auth-header__dropdown--in-menu" : ""}`}
        role="menu"
      >
        <div className="auth-header__dropdown-header">
          <span className="auth-header__dropdown-username">
            {user.username}
          </span>
          <span className="auth-header__dropdown-role">{user.role}</span>
        </div>

        {/* 1. Menu item TRANG CÁ NHÂN */}
        {!hideProfileLink && (
          <Link
            className="auth-header__dropdown-link"
            href="/profile"
            role="menuitem"
            onClick={() => closeMenu()}
          >
            {authHeader.profileLabel}
          </Link>
        )}

        {/* 2. Menu item TRANG QUẢN TRỊ (dành riêng cho Admin) */}
        {user.role?.toUpperCase() === "ADMIN" && (
          <Link
            className="auth-header__dropdown-link"
            href="/admin"
            role="menuitem"
            onClick={() => closeMenu()}
          >
            Trang quản trị
          </Link>
        )}

        {/* 3. Menu item NHẬN XU (dùng icon GiftOutlined của antd) */}
        <button
          className="auth-header__dropdown-link"
          type="button"
          role="menuitem"
          style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ca8a04", fontWeight: 700 }}
          onClick={() => {
            closeMenu();
            setIsDailyRewardOpen(true);
          }}
        >
          <GiftOutlined style={{ fontSize: "16px", color: "#f59e0b" }} />
          <span>Nhận xu</span>
        </button>

        <button
          className="auth-header__dropdown-link auth-header__dropdown-link--logout"
          type="button"
          role="menuitem"
          onClick={() => {
            closeMenu();
            logout();
          }}
        >
          {authHeader.logoutLabel}
        </button>
      </div>

      <DailyRewardModal
        isOpen={isDailyRewardOpen}
        onClose={() => setIsDailyRewardOpen(false)}
      />
    </div>
  );
}


export { AuthHeader };
export type { AuthHeaderProps };
