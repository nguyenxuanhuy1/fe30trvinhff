"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GiftOutlined } from "@ant-design/icons";
import { useAuth } from "@/modules/auth";
import { DailyRewardModal } from "@/modules/rewards";
import "./lessons-top-hud.scss";


const FALLBACK_AVATAR = "/images/chuotuser.webp";

export function LessonsTopHud() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen, closeDropdown]);

  const [isDailyRewardOpen, setIsDailyRewardOpen] = useState(false);
  const autoCheckedRef = useRef(false);

  // Lần đầu vào trang trong ngày: tự động hiện bảng nhận xu nếu chưa tắt
  useEffect(() => {
    if (!user?.id || autoCheckedRef.current) return;
    autoCheckedRef.current = true;
    const today = new Date().toISOString().slice(0, 10);
    const key = `daily_reward_seen_${today}_${user.id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      setIsDailyRewardOpen(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const handleOpenReward = () => {
      if (!user) {
        router.push("/login?next=/lessons");
        return;
      }
      setIsDailyRewardOpen(true);
    };
    window.addEventListener("open-daily-reward", handleOpenReward);
    return () => window.removeEventListener("open-daily-reward", handleOpenReward);
  }, [user, router]);

  const avatarSrc = user?.avatarUrl || user?.inventoryAvatarUrl || FALLBACK_AVATAR;
  const username = user?.username || "Khách";
  // Ngưỡng giới hạn ký tự trên mobile: nếu dài hơn 10 chữ thì hiển thị 10 chữ kèm ...
  const MAX_MOBILE_CHARS = 10;
  const mobileUsername =
    username.length > MAX_MOBILE_CHARS
      ? `${username.slice(0, MAX_MOBILE_CHARS)}...`
      : username;

  return (
    <>
      <aside className="lessons-top-hud" aria-label="Bảng điều khiển người chơi">
        {/* Avatar + tên và Dropdown tài khoản */}
        <div className="lessons-top-hud__user-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="lessons-top-hud__user-btn"
            onClick={toggleDropdown}
            aria-expanded={isDropdownOpen}
            aria-haspopup="menu"
            aria-label={`Tài khoản: ${username}`}
          >
            <span className="lessons-top-hud__avatar-frame">
              <Image
                src={avatarSrc}
                alt={username}
                width={34}
                height={34}
                className="lessons-top-hud__avatar-img"
                unoptimized
              />
            </span>
            <span className="lessons-top-hud__username" title={username}>
              <span className="lessons-top-hud__username-desktop">{username}</span>
              <span className="lessons-top-hud__username-mobile">{mobileUsername}</span>
            </span>
            <svg
              className={`lessons-top-hud__chevron${isDropdownOpen ? " lessons-top-hud__chevron--open" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="lessons-top-hud__dropdown" role="menu">
              <div className="lessons-top-hud__dropdown-header">
                <div className="lessons-top-hud__dropdown-user-info">
                  <div className="lessons-top-hud__dropdown-avatar-frame">
                    <Image
                      src={avatarSrc}
                      alt={username}
                      width={38}
                      height={38}
                      className="lessons-top-hud__avatar-img"
                      unoptimized
                    />
                  </div>
                  <div className="lessons-top-hud__dropdown-user-details">
                    <span className="lessons-top-hud__dropdown-name" title={username}>
                      {username}
                    </span>
                    {user?.role && (
                      <span className="lessons-top-hud__dropdown-role">
                        {user.role === "ADMIN" ? "Quản trị viên" : "Học viên"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {user ? (
                <>
                  {/* 1. Menu item TRANG CÁ NHÂN */}
                  <Link
                    href="/profile"
                    className="lessons-top-hud__dropdown-item"
                    role="menuitem"
                    onClick={closeDropdown}
                  >
                    <svg
                      className="lessons-top-hud__dropdown-item-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Trang cá nhân</span>
                  </Link>

                  {/* 2. Menu item TRANG QUẢN TRỊ (dành riêng cho Admin) */}
                  {user.role?.toUpperCase() === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="lessons-top-hud__dropdown-item lessons-top-hud__dropdown-item--admin"
                      role="menuitem"
                      onClick={closeDropdown}
                    >
                      <svg
                        className="lessons-top-hud__dropdown-item-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>Trang quản trị</span>
                    </Link>
                  )}

                  {/* 3. Menu item NHẬN XU (dùng icon GiftOutlined của antd) */}
                  <button
                    type="button"
                    className="lessons-top-hud__dropdown-item lessons-top-hud__dropdown-item--coin"
                    role="menuitem"
                    onClick={() => {
                      closeDropdown();
                      setIsDailyRewardOpen(true);
                    }}
                  >
                    <GiftOutlined className="lessons-top-hud__dropdown-item-icon lessons-top-hud__dropdown-gift-icon" />
                    <span>Nhận xu</span>
                  </button>

                  {/* 4. Menu item ĐĂNG XUẤT */}
                  <button
                    type="button"
                    className="lessons-top-hud__dropdown-item lessons-top-hud__dropdown-item--logout"
                    role="menuitem"
                    onClick={() => {
                      closeDropdown();
                      logout();
                    }}
                  >
                    <svg
                      className="lessons-top-hud__dropdown-item-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <Link

                href="/login"
                className="lessons-top-hud__dropdown-item"
                role="menuitem"
                onClick={closeDropdown}
              >
                <svg
                  className="lessons-top-hud__dropdown-item-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>

    <DailyRewardModal
      isOpen={isDailyRewardOpen}
      onClose={() => setIsDailyRewardOpen(false)}
    />
  </>
  );
}

