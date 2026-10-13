"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/modules/auth/types";
import { AdminOverviewPanel } from "./panels/admin-overview-panel";
import { AdminLessonsPanel } from "./panels/admin-lessons-panel";
import { AdminRoomsPanel } from "./panels/admin-rooms-panel";
import { AdminUsersPanel } from "./panels/admin-users-panel";
import { AdminArticlesPanel } from "./panels/admin-articles-panel";
import { AdminCoinsPanel } from "./panels/admin-coins-panel";
import { AdminSocialPanel } from "./panels/admin-social-panel";
import { AdminShopPanel } from "./panels/admin-shop-panel";
import { adminPage, adminTabs } from "./admin.const";


import type { AdminTab } from "./admin.const";

interface AdminViewProps {
  user: User;
  initialTab: AdminTab;
}

function AdminView({ user, initialTab }: AdminViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function handleTabSelect(tab: AdminTab) {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    router.push(`/admin?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="admin-layout">
      {/* Overlay cho mobile khi sidebar mở */}
      {isSidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* CỘT MENU BÊN TRÁI (SIDEBAR) */}
      <aside className={`admin-sidebar ${isSidebarOpen ? "admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="0" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div className="admin-sidebar__brand-text">
            <span className="admin-sidebar__brand-title">ADMIN PORTAL</span>
            <span className="admin-sidebar__brand-sub">Quản trị hệ thống</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Menu chức năng quản trị">
          <div className="admin-sidebar__nav-group-title">CHỨC NĂNG HỆ THỐNG</div>

          {/* 0. Tổng quan */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.overview ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.overview)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.overview}</span>
          </button>

          {/* 1. Quản lý phòng học */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.rooms ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.rooms)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.rooms}</span>
          </button>

          {/* 2. Quản lý bài học */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.lessons ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.lessons)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.lessons}</span>
          </button>

          {/* 3. Quản lý tài khoản */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.users ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.users)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.users}</span>
          </button>

          {/* 4. Quản lý tin tức */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.articles ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.articles)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" />
              <path d="M15 18h-5" />
              <path d="M10 6h8v4h-8V6Z" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.articles}</span>
          </button>

          {/* 5. Quản lý Xu & Điểm danh */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.coins ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.coins)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 6v12" />
              <path d="M16 10h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.coins}</span>
          </button>

          {/* 6. Quản lý Fanpage */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.social ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.social)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <circle cx="18" cy="18" r="2.5" />
              <line x1="8.2" y1="10.8" x2="15.8" y2="7.2" />
              <line x1="8.2" y1="13.2" x2="15.8" y2="16.8" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.social}</span>
          </button>

          {/* 7. Quản lý Giỏ hàng & Vật phẩm */}
          <button
            type="button"
            className={`admin-sidebar__item ${activeTab === adminTabs.cart ? "admin-sidebar__item--active" : ""}`}
            onClick={() => handleTabSelect(adminTabs.cart)}
          >
            <svg
              className="admin-sidebar__item-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="admin-sidebar__item-text">{adminPage.tabs.cart}</span>
          </button>
        </nav>



        {/* THÔNG TIN TÀI KHOẢN VÀ ĐIỀU HƯỚNG VỀ TRANG CHỦ */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__username" title={user.username}>
                {user.username}
              </span>
              <span className="admin-sidebar__userrole">
                {adminPage.userPanel.role[user.role] ?? user.role}
              </span>
            </div>
          </div>

          <Link href="/lessons" className="admin-sidebar__exit-link" title="Quay lại">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>{adminPage.backHome}</span>
          </Link>
        </div>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH BÊN PHẢI */}
      <main className="admin-main">
        {/* THANH TOPBAR TRÊN CÙNG */}
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-topbar__toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Mở menu quản trị"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="admin-topbar__breadcrumb">
              <span className="admin-topbar__breadcrumb-root">Quản trị</span>
              <span className="admin-topbar__breadcrumb-separator">/</span>
              <span className="admin-topbar__breadcrumb-current">
                {adminPage.tabs[activeTab]}
              </span>
            </div>
          </div>

          <div className="admin-topbar__right">
            <span className="admin-topbar__badge">ROLE: {user.role}</span>
          </div>
        </header>

        {/* NỘI DUNG CHỨC NĂNG ĐƯỢC CHỌN */}
        <div className="admin-content">
          <div className="admin-panel-wrapper">
            {activeTab === adminTabs.overview && (
              <AdminOverviewPanel onNavigateTab={(tab) => handleTabSelect(tab as AdminTab)} />
            )}
            {activeTab === adminTabs.rooms && <AdminRoomsPanel />}
            {activeTab === adminTabs.lessons && <AdminLessonsPanel />}
            {activeTab === adminTabs.users && <AdminUsersPanel currentUserId={user.id} />}
            {activeTab === adminTabs.articles && <AdminArticlesPanel />}
            {activeTab === adminTabs.coins && <AdminCoinsPanel />}
            {activeTab === adminTabs.social && <AdminSocialPanel />}
            {activeTab === adminTabs.cart && <AdminShopPanel />}
          </div>


        </div>
      </main>
    </div>
  );
}

export { AdminView };
export type { AdminViewProps };
