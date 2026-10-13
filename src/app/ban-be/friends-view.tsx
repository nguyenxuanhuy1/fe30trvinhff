"use client";

import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/modules/auth";
import {
  createGroup,
  getFriendsOverview,
  getSentInvitations,
  inviteToGroup,
  leaveGroup,
  respondToInvitation,
} from "@/modules/friends/services/friends.service";
import type {
  FriendCandidate,
  Group,
  GroupInvitation,
  InvitationAction,
  SentInvitation,
} from "@/modules/friends/types";
import { FriendSearchHeader } from "./friend-search/friend-search-header";
import { StreakFlame } from "./streak-flame/streak-flame";
import { GameButton } from "@/components/ui/game-button";
import { GameModal } from "@/components/ui/game-modal";
import { toast } from "@/components/ui/game-toast";
import { LogoutOutlined } from "@ant-design/icons";
import { friendsPage } from "./friends.const";
import "./friends.scss";

const FALLBACK_AVATAR = "/images/chuotuser.png";

function FriendsPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [received, setReceived] = useState<GroupInvitation[]>([]);
  const [sent, setSent] = useState<SentInvitation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.replace("/login?next=/ban-be");
      return;
    }

    async function loadOverview() {
      try {
        const overview = await getFriendsOverview();
        setGroup(overview.group);
        setReceived(overview.received);
        setSent(overview.sent);
      } catch {
        toast.error("Không tải được dữ liệu nhóm, vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadOverview();
  }, [isAuthLoading, user, router]);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    const name = newGroupName.trim();
    if (name.length < 2) {
      setCreateError("Tên nhóm phải có ít nhất 2 ký tự");
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createGroup(name);
      setGroup(created);
      setIsCreateModalOpen(false);
      setNewGroupName("");
      toast.success(`Đã tạo thành công nhóm "${created.name}"!`);
      const overview = await getFriendsOverview();
      setGroup(overview.group);
      setReceived(overview.received);
      setSent(overview.sent);
    } catch (error) {
      setCreateError(getErrorMessage(error, "Tạo nhóm thất bại, vui lòng thử lại"));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleLeaveGroup() {
    if (!group) return;
    setIsLeaving(true);
    try {
      const res = await leaveGroup();
      toast.info(res.message || "Bạn đã rời khỏi nhóm.");
      setIsLeaveModalOpen(false);
      const overview = await getFriendsOverview();
      setGroup(overview.group);
      setReceived(overview.received);
      setSent(overview.sent);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể rời nhóm, vui lòng thử lại"));
    } finally {
      setIsLeaving(false);
    }
  }

  const invitedUserIds = useMemo(() => {
    return new Set(sent.filter((s) => s.status === "PENDING").map((s) => s.inviteeId));
  }, [sent]);

  async function handleInvite(candidate: FriendCandidate): Promise<boolean> {
    if (!group) return false;
    setPendingId(candidate.id);
    try {
      const invitation = await inviteToGroup(group.id, candidate.id);
      setSent((prev) => [
        {
          ...invitation,
          invitee: {
            id: candidate.id,
            username: candidate.username,
            avatarUrl: candidate.avatarUrl,
          },
        },
        ...prev.filter((inv) => inv.inviteeId !== candidate.id),
      ]);
      toast.success(`Đã gửi lời mời tham gia nhóm tới "${candidate.username}"`);
      void getSentInvitations().then((updatedSent) => setSent(updatedSent));
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể gửi lời mời"));
      return false;
    } finally {
      setPendingId(null);
    }
  }

  async function handleRespond(invitation: GroupInvitation, action: InvitationAction) {
    setPendingId(invitation.id);
    try {
      await respondToInvitation(invitation.id, action);
      if (action === "ACCEPT") {
        toast.success(`Bạn đã tham gia nhóm "${invitation.group.name}"!`);
      } else {
        toast.info("Đã từ chối lời mời tham gia nhóm.");
      }
      const overview = await getFriendsOverview();
      setGroup(overview.group);
      setReceived(overview.received);
      setSent(overview.sent);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không xử lý được lời mời"));
    } finally {
      setPendingId(null);
    }
  }

  const isOwner = group !== null && group.ownerId === user?.id;

  // Sắp xếp thành viên sao cho Trưởng nhóm (OWNER) luôn ở hàng đầu tiên
  const sortedMembers = group
    ? [...group.members].sort((a, b) => {
        if (a.role === "OWNER") return -1;
        if (b.role === "OWNER") return 1;
        return 0;
      })
    : [];

  if (isAuthLoading || (isLoading && user)) {
    return (
      <div className="friends-page-root">
        <header className="friends-header">
          <div className="friends-header__left">
            <Link href="/" className="friends-header__back-btn">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Quay lại</span>
            </Link>
          </div>
        </header>
        <main className="friends-loading-wrap">
          <p className="friends-loading-text">{friendsPage.loading}</p>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="friends-page-root">
      {/* 1. Header màu đen với nút quay lại bên trái và thanh tìm kiếm bên phải */}
      <header className="friends-header">
        <div className="friends-header__left">
          <Link href="/lessons" className="friends-header__back-btn" title="Quay lại">
            <svg
              className="friends-header__back-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="friends-header__back-text">Quay lại</span>
          </Link>
        </div>

        <div className="friends-header__right">
          <FriendSearchHeader
            onInvite={handleInvite}
            pendingId={pendingId}
            userHasGroup={group !== null}
            isOwner={isOwner}
            invitedUserIds={invitedUserIds}
          />
        </div>
      </header>



      {/* 2. Content */}
      <main className="friends-content-container">
        <div className="friends-layout">
          {/* Cột trái: Lời mời vào nhóm (desktop: chiếm 30% width, height full flex cùng cột phải; mobile: floating bar lơ lửng đáy) */}
          <aside className="friends-floating-bar">
            {/* Phần 1: Lời mời vào nhóm */}
            <div className="friends-floating-bar__invitations">
              <div className="friends-floating-bar__header">
                <div className="friends-floating-bar__title-wrap">
                  <span className="friends-floating-bar__icon">✉️</span>
                  <span className="friends-floating-bar__title">Lời mời vào nhóm</span>
                  {received.length > 0 && (
                    <span className="friends-floating-bar__counter">{received.length}</span>
                  )}
                </div>
              </div>

              {received.length === 0 ? (
                <div className="friends-floating-bar__empty">
                  {group !== null
                    ? "Không có lời mời tham gia nhóm mới"
                    : friendsPage.hints.emptyInvitations}
                </div>
              ) : (
                <ul className="friends-floating-bar__list">
                  {received.map((invitation) => (
                    <li className="friends-floating-bar__item" key={invitation.id}>
                      <div className="friends-floating-bar__user">
                        <span className="friends-floating-bar__avatar">
                          <Image
                            src={invitation.inviter.avatarUrl ?? FALLBACK_AVATAR}
                            alt={invitation.inviter.username}
                            width={28}
                            height={28}
                            unoptimized
                          />
                        </span>
                        <div className="friends-floating-bar__meta">
                          <span className="friends-floating-bar__sender">
                            {invitation.inviter.username}
                          </span>
                          <span className="friends-floating-bar__group">
                            Nhóm: {invitation.group.name}
                          </span>
                        </div>
                      </div>

                      <div className="friends-floating-bar__actions">
                        <button
                          type="button"
                          className="friends-floating-bar__btn friends-floating-bar__btn--accept"
                          disabled={pendingId === invitation.id}
                          onClick={() => handleRespond(invitation, "ACCEPT")}
                        >
                          {pendingId === invitation.id ? "..." : "Tham gia"}
                        </button>
                        <button
                          type="button"
                          className="friends-floating-bar__btn friends-floating-bar__btn--reject"
                          disabled={pendingId === invitation.id}
                          onClick={() => handleRespond(invitation, "REJECT")}
                        >
                          Từ chối
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Phần 2: Footer box lời mời: "Chuỗi của nhóm là : Chuỗi + lửa" căn lề phía bên phải */}
            <div
              className={`friends-floating-bar__flame-section ${
                (group ? Boolean(group.isFrozen) : true) ? "friends-floating-bar__flame-section--frozen" : ""
              }`}
              title={
                !group
                  ? "Chưa gia nhập nhóm"
                  : group.isFrozen
                  ? "Chuỗi nhóm đã chuyển thành băng và bị mất vì có thành viên chưa đăng nhập hôm nay"
                  : `Chuỗi của nhóm: ${group.streak ?? 0} ngày liên tiếp`
              }
            >
              <span className="friends-floating-bar__flame-label">Chuỗi của nhóm:</span>
              <span className="friends-floating-bar__flame-count">
                {!group || group.isFrozen ? 0 : (group.streak ?? 0)}
              </span>
              <StreakFlame
                size="sm"
                variant={!group || group.isFrozen ? "ice" : "fire"}
                days={!group || group.isFrozen ? 0 : (group.streak ?? 0)}
              />
            </div>
          </aside>

          <section className="friends-col-right">
            {group !== null ? (
              <div className="friends-group-details">
                {/* Header nhóm */}
                <div className="friends-group-details__head">
                  <div className="friends-group-details__title-group">
                    <h2 className="friends-group-details__name" title={group.name}>{group.name}</h2>
                  </div>
                  <button
                    type="button"
                    className="friends-leave-group-trigger"
                    onClick={() => setIsLeaveModalOpen(true)}
                    title="Rời khỏi nhóm này"
                    aria-label="Rời nhóm"
                  >
                    <LogoutOutlined className="friends-leave-group-trigger__icon" />
                    <span className="friends-leave-group-trigger__text">Rời nhóm</span>
                  </button>
                </div>

                {/* Danh sách thành viên: Hàng đầu tiên là Trưởng nhóm, vai trò, ngọn lửa đang giữ chuỗi */}
                <div className="friends-members-section">
                  <h3 className="friends-members-section__title">
                    THÀNH VIÊN ({group.members.length})
                  </h3>

                  <div className="friends-members-list">
                    {sortedMembers.map((member, index) => {
                      const isLeader = member.role === "OWNER" || index === 0;
                      const hasLoggedIn = Boolean(member.hasLoggedInToday);

                      return (
                        <div
                          key={member.id}
                          className={`friends-member-card ${
                            isLeader ? "friends-member-card--leader" : ""
                          }`}
                        >
                          <div className="friends-member-card__user">
                            <div className="friends-member-card__avatar-wrap">
                              <Image
                                className="friends-member-card__avatar"
                                src={member.user.avatarUrl ?? FALLBACK_AVATAR}
                                alt={member.user.username}
                                width={44}
                                height={44}
                                unoptimized
                              />
                              {isLeader && (
                                <span className="friends-member-card__crown-badge">👑</span>
                              )}
                            </div>

                            <div className="friends-member-card__info">
                              <div className="friends-member-card__name-row">
                                <span className="friends-member-card__name">
                                  {member.user.username}
                                </span>
                                {member.user.id === user.id && (
                                  <span className="friends-member-card__you-badge">Bạn</span>
                                )}
                              </div>
                              <span className="friends-member-card__joined">
                                {friendsPage.memberSince(member.joinedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="friends-member-card__right">
                            {/* Tag Trưởng nhóm gắn ở trên mép box */}
                            {isLeader && (
                              <span className="friends-member-card__role friends-member-card__role--leader">
                                Trưởng nhóm
                              </span>
                            )}

                            {/* Ngọn lửa chuỗi cho mỗi thành viên: hiển thị khi đã đăng nhập hôm nay, chưa đăng nhập thì hiện băng */}
                            <div
                              className="friends-streak-keeper-flame"
                              title={
                                hasLoggedIn
                                  ? `${member.user.username} đã đăng nhập hôm nay (Duy trì ngọn lửa)`
                                  : `${member.user.username} chưa đăng nhập hôm nay (Chuỗi chuyển thành băng)`
                              }
                            >
                              {hasLoggedIn ? (
                                <StreakFlame size="sm" variant="fire" />
                              ) : (
                                <span className="friends-member-frozen-tag" title="Chưa đăng nhập hôm nay">
                                  🧊
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Các lời mời đã gửi bởi nhóm */}
                {sent.length > 0 && (
                  <div className="friends-sent-section">
                    <h4 className="friends-sent-section__title">
                      Lời mời nhóm đã gửi đi ({sent.length})
                    </h4>
                    <div className="friends-sent-list">
                      {sent.map((inv) => (
                        <div className="friends-sent-item" key={inv.id}>
                          <span className="friends-sent-item__name">
                            {inv.invitee.username}
                          </span>
                          <span className="friends-sent-item__status">Đang chờ phản hồi</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Chưa có nhóm: Hiển thị trạng thái hướng dẫn tham gia / tạo nhóm */
              <div className="friends-empty-group">
                <div className="friends-empty-group__icon">🛡️</div>
                <h2 className="friends-empty-group__title">Bạn chưa gia nhập nhóm nào</h2>
                <p className="friends-empty-group__desc">
                  Hãy nhấn vào nút <strong>&quot;Tạo nhóm mới&quot;</strong> ở cột bên trái để trở thành
                  Trưởng nhóm và thắp lên ngọn lửa chuỗi đầu tiên, hoặc đợi lời mời từ bạn bè!
                </p>
                <div className="friends-empty-group__action">
                  <button
                    className="friends-btn-light"
                    onClick={() => {
                      setCreateError(null);
                      setIsCreateModalOpen(true);
                    }}
                  >
                    👑 Tạo nhóm ngay
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>


      {/* MODAL TẠO NHÓM MỚI */}
      <GameModal
        open={isCreateModalOpen}
        onCancel={() => {
          if (!isCreating) {
            setIsCreateModalOpen(false);
            setCreateError(null);
          }
        }}
        footer={null}
        title="Tạo nhóm mới"
        width={440}
      >
        <form className="friends-modal-form" onSubmit={handleCreateGroup}>
          <p className="friends-modal-form__desc">
            Đặt tên cho nhóm thám hiểm của bạn. Tên nhóm sẽ được hiển thị cho tất cả thành viên.
          </p>
          <div className="friends-modal-form__field">
            <label htmlFor="group-name-input" className="friends-modal-form__label">
              Tên nhóm:
            </label>
            <input
              id="group-name-input"
              className="friends-modal-form__input"
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ví dụ: Biệt Đội Chuột Vàng..."
              maxLength={60}
              autoFocus
            />
          </div>

          {createError && (
            <div className="friends-modal-form__error">{createError}</div>
          )}

          <div className="friends-modal-form__actions">
            <button
              type="button"
              className="friends-modal-form__btn-cancel"
              disabled={isCreating}
              onClick={() => setIsCreateModalOpen(false)}
            >
              Hủy
            </button>
            <GameButton
              type="submit"
              size="md"
              disabled={isCreating || newGroupName.trim().length < 2}
            >
              {isCreating ? "Đang tạo..." : "Xác nhận tạo"}
            </GameButton>
          </div>
        </form>
      </GameModal>

      {/* MODAL XÁC NHẬN RỜI NHÓM */}
      <GameModal
        open={isLeaveModalOpen}
        onCancel={() => {
          if (!isLeaving) setIsLeaveModalOpen(false);
        }}
        footer={null}
        title={friendsPage.confirmLeave.title}
        width={440}
      >
        <div className="friends-modal-leave">
          <p className="friends-modal-leave__prompt">
            {group ? friendsPage.confirmLeave.prompt(group.name, isOwner) : ""}
          </p>

          <div className="friends-modal-leave__actions">
            <button
              type="button"
              className="friends-modal-form__btn-cancel"
              disabled={isLeaving}
              onClick={() => setIsLeaveModalOpen(false)}
            >
              {friendsPage.confirmLeave.cancel}
            </button>
            <button
              type="button"
              className="friends-modal-leave__btn-confirm"
              disabled={isLeaving}
              onClick={handleLeaveGroup}
            >
              {isLeaving ? "Đang rời..." : friendsPage.confirmLeave.confirm}
            </button>
          </div>
        </div>
      </GameModal>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export { FriendsPage };
