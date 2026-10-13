"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FriendCandidate } from "@/modules/friends/types";
import { searchFriends } from "@/modules/friends/services/friends.service";
import "./friend-search-header.scss";

const FALLBACK = "/images/chuotuser.png";

interface FriendSearchHeaderProps {
  onInvite: (candidate: FriendCandidate) => Promise<boolean> | boolean | void;
  pendingId: string | null;
  userHasGroup: boolean;
  isOwner: boolean;
  invitedUserIds?: Set<string>;
}

export function FriendSearchHeader({
  onInvite,
  pendingId,
  userHasGroup,
  isOwner,
  invitedUserIds,
}: FriendSearchHeaderProps) {
  const [keyword, setKeyword] = useState("");
  const [candidates, setCandidates] = useState<FriendCandidate[]>([]);
  const [localInvitedIds, setLocalInvitedIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const drawerInputRef = useRef<HTMLInputElement>(null);

  // Đóng dropdown desktop khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tự động focus ô tìm kiếm khi mở drawer mobile và hỗ trợ phím Escape
  useEffect(() => {
    if (isDrawerOpen) {
      setTimeout(() => {
        drawerInputRef.current?.focus();
      }, 150);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
        setIsDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  async function handleSearch(event?: React.FormEvent) {
    if (event) event.preventDefault();
    const term = keyword.trim();
    if (!term) return;

    setIsLoading(true);
    setHasSearched(true);
    setErrorMessage(null);
    setIsDropdownOpen(true);

    try {
      const results = await searchFriends(term);
      setCandidates(results);
    } catch {
      setCandidates([]);
      setErrorMessage("Tìm kiếm thất bại, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenDrawer() {
    setIsDrawerOpen(true);
  }

  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  async function handleInviteClick(candidate: FriendCandidate) {
    // 1. Cập nhật optimistic ngay lập tức để người dùng thấy realtime đổi thành 'Đã mời'
    setLocalInvitedIds((prev) => new Set(prev).add(candidate.id));
    setCandidates((prev) =>
      prev.map((item) =>
        item.id === candidate.id ? { ...item, isInvitedByMe: true } : item
      )
    );

    // 2. Gửi request mời lên server
    try {
      const result = await onInvite(candidate);
      if (result === false) {
        // Rollback nếu server trả về lỗi hoặc thất bại
        setLocalInvitedIds((prev) => {
          const next = new Set(prev);
          next.delete(candidate.id);
          return next;
        });
        setCandidates((prev) =>
          prev.map((item) =>
            item.id === candidate.id ? { ...item, isInvitedByMe: false } : item
          )
        );
      }
    } catch {
      // Rollback nếu có ngoại lệ
      setLocalInvitedIds((prev) => {
        const next = new Set(prev);
        next.delete(candidate.id);
        return next;
      });
      setCandidates((prev) =>
        prev.map((item) =>
          item.id === candidate.id ? { ...item, isInvitedByMe: false } : item
        )
      );
    }
  }

  function renderCandidateItem(candidate: FriendCandidate) {
    const isInvited =
      candidate.isInvitedByMe ||
      localInvitedIds.has(candidate.id) ||
      (invitedUserIds ? invitedUserIds.has(candidate.id) : false);
    const isMember = candidate.isMyGroupMember;
    const hasOtherGroup = candidate.hasGroup;
    const isPending = pendingId === candidate.id;

    return (
      <li className="friend-search-dropdown__item" key={candidate.id}>
        <div className="friend-search-dropdown__user">
          <span className="friend-search-dropdown__avatar">
            <Image
              src={candidate.avatarUrl ?? FALLBACK}
              alt={candidate.username}
              width={36}
              height={36}
              unoptimized
            />
          </span>
          <div className="friend-search-dropdown__meta">
            <span className="friend-search-dropdown__name">{candidate.username}</span>
            {hasOtherGroup && (
              <span className="friend-search-dropdown__tag friend-search-dropdown__tag--warn">
                Đã có nhóm{candidate.groupName ? `: ${candidate.groupName}` : ""}
              </span>
            )}
            {isMember && (
              <span className="friend-search-dropdown__tag friend-search-dropdown__tag--member">
                Đang trong nhóm bạn
              </span>
            )}
            {isInvited && (
              <span className="friend-search-dropdown__tag friend-search-dropdown__tag--invited">
                Đã gửi lời mời
              </span>
            )}
          </div>
        </div>

        <div className="friend-search-dropdown__action">
          {isMember ? (
            <span className="friend-search-dropdown__badge">Thành viên</span>
          ) : isInvited ? (
            <span className="friend-search-dropdown__badge friend-search-dropdown__badge--invited">
              Đã mời
            </span>
          ) : hasOtherGroup ? (
            <span className="friend-search-dropdown__badge friend-search-dropdown__badge--muted">
              Đã có nhóm
            </span>
          ) : !userHasGroup ? (
            <span
              className="friend-search-dropdown__badge friend-search-dropdown__badge--disabled"
              title="Tạo nhóm trước để có thể mời bạn bè"
            >
              Cần tạo nhóm
            </span>
          ) : !isOwner ? (
            <span
              className="friend-search-dropdown__badge friend-search-dropdown__badge--disabled"
              title="Chỉ trưởng nhóm mới có quyền mời"
            >
              Chỉ trưởng nhóm
            </span>
          ) : (
            <button
              className="friend-search-dropdown__invite-btn"
              type="button"
              disabled={isPending}
              onClick={() => handleInviteClick(candidate)}
            >
              {isPending ? "Đang gửi..." : "Mời thêm vào nhóm"}
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <div className="friend-search-header" ref={containerRef}>
      {/* 1. GIAO DIỆN DESKTOP (Ẩn trên Mobile) */}
      <div className="friend-search-header__desktop">
        <form className="friend-search-header__form" onSubmit={handleSearch}>
          <div className="friend-search-header__input-wrap">
            <svg
              className="friend-search-header__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="friend-search-header__input"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm bạn bè..."
              maxLength={50}
            />
            {keyword.length > 0 && (
              <button
                type="button"
                className="friend-search-header__clear"
                onClick={() => {
                  setKeyword("");
                  setIsDropdownOpen(false);
                }}
                aria-label="Xóa từ khóa"
              >
                ✕
              </button>
            )}
          </div>
          <button
            className="friend-search-header__btn"
            type="submit"
            disabled={isLoading || !keyword.trim()}
          >
            {isLoading ? "..." : "Tìm kiếm"}
          </button>
        </form>

        {/* Dropdown kết quả tìm kiếm trên desktop */}
        {isDropdownOpen && hasSearched && (
          <div className="friend-search-dropdown">
            <div className="friend-search-dropdown__header">
              <span className="friend-search-dropdown__title">
                Kết quả tìm kiếm ({candidates.length})
              </span>
              <button
                type="button"
                className="friend-search-dropdown__close"
                onClick={() => setIsDropdownOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="friend-search-dropdown__body">
              {isLoading && (
                <div className="friend-search-dropdown__message">Đang tìm kiếm bạn bè...</div>
              )}

              {!isLoading && errorMessage && (
                <div className="friend-search-dropdown__message friend-search-dropdown__message--error">
                  {errorMessage}
                </div>
              )}

              {!isLoading && !errorMessage && candidates.length === 0 && (
                <div className="friend-search-dropdown__message">
                  Không tìm thấy người dùng phù hợp với &quot;{keyword}&quot;
                </div>
              )}

              {!isLoading && candidates.length > 0 && (
                <ul className="friend-search-dropdown__list">
                  {candidates.map(renderCandidateItem)}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. ICON TRIGGER TRÊN MOBILE (Chỉ hiện trên Mobile) */}
      <button
        type="button"
        className="friend-search-header__mobile-toggle"
        onClick={handleOpenDrawer}
        aria-label="Mở tìm kiếm bạn bè"
        title="Tìm kiếm bạn bè"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {/* 3. DRAWER XỔ XUỐNG TRÊN MOBILE */}
      {isDrawerOpen && (
        <>
          <div
            className="friend-search-drawer-overlay"
            onClick={handleCloseDrawer}
            aria-hidden="true"
          />
          <div
            className="friend-search-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Tìm kiếm bạn bè"
          >
            <div className="friend-search-drawer__header">
              <div className="friend-search-drawer__title-wrap">
                <svg
                  className="friend-search-drawer__header-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3 className="friend-search-drawer__title">Tìm kiếm bạn bè</h3>
              </div>
              <button
                type="button"
                className="friend-search-drawer__close"
                onClick={handleCloseDrawer}
                aria-label="Đóng thanh tìm kiếm"
              >
                ✕
              </button>
            </div>

            <div className="friend-search-drawer__content">
              {/* Form tìm kiếm trong drawer */}
              <form className="friend-search-drawer__form" onSubmit={handleSearch}>
                <div className="friend-search-drawer__input-wrap">
                  <svg
                    className="friend-search-drawer__input-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    ref={drawerInputRef}
                    className="friend-search-drawer__input"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Nhập tên người dùng..."
                    maxLength={50}
                  />
                  {keyword.length > 0 && (
                    <button
                      type="button"
                      className="friend-search-drawer__clear"
                      onClick={() => setKeyword("")}
                      aria-label="Xóa từ khóa"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  className="friend-search-drawer__btn"
                  type="submit"
                  disabled={isLoading || !keyword.trim()}
                >
                  {isLoading ? "..." : "Tìm"}
                </button>
              </form>

              {/* Danh sách kết quả trong drawer */}
              <div className="friend-search-drawer__body">
                {isLoading && (
                  <div className="friend-search-dropdown__message">Đang tìm kiếm bạn bè...</div>
                )}

                {!isLoading && errorMessage && (
                  <div className="friend-search-dropdown__message friend-search-dropdown__message--error">
                    {errorMessage}
                  </div>
                )}

                {!isLoading && hasSearched && candidates.length === 0 && !errorMessage && (
                  <div className="friend-search-dropdown__message">
                    Không tìm thấy người dùng phù hợp với &quot;{keyword}&quot;
                  </div>
                )}

                {!isLoading && !hasSearched && (
                  <div className="friend-search-drawer__hint">
                    Nhập tên người dùng để tìm kiếm bạn bè và gửi lời mời gia nhập nhóm thám hiểm!
                  </div>
                )}

                {!isLoading && candidates.length > 0 && (
                  <div className="friend-search-drawer__results">
                    <div className="friend-search-drawer__results-head">
                      <span>Kết quả ({candidates.length})</span>
                    </div>
                    <ul className="friend-search-dropdown__list">
                      {candidates.map(renderCandidateItem)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
