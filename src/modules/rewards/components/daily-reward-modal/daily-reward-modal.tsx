"use client";

import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { claimDailyReward, getDailyRewardStatus } from "../../services/reward.service";
import type { DailyRewardStatus } from "../../types";
import { CoinIcon } from "@/components/ui/coin-icon";
import { ErrorState } from "@/components/ui/error-state";
import "./daily-reward-modal.scss";

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (coinsEarned: number, totalCoins: number) => void;
}

const DAILY_REWARD_STATUS_KEY = "daily-reward-status";
const SKELETON_DAYS = [1, 2, 3, 4, 5, 6, 7];

// Ưu tiên thông báo backend trả về thay vì "Request failed with status code 500"
function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === "string" && message.length > 0) return message;
    if (!error.response) return "Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.";
  }
  return fallback;
}

export function DailyRewardModal({
  isOpen,
  onClose,
  onRewardClaimed,
}: DailyRewardModalProps) {
  const { user, updateCoins } = useAuth();
  const queryClient = useQueryClient();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const userId = user?.id;
  const queryKey = [DAILY_REWARD_STATUS_KEY, userId];

  // Mỗi lần mở bảng đều lấy trạng thái mới (staleTime 0); lỗi chỉ hiện trong thân bảng
  const statusQuery = useQuery({
    queryKey,
    queryFn: getDailyRewardStatus,
    enabled: isOpen && Boolean(userId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const status = statusQuery.data ?? null;
  const serverCoins = status?.userCoins;

  useEffect(() => {
    if (serverCoins !== undefined) updateCoins(serverCoins);
    // updateCoins từ context không ổn định tham chiếu, chỉ đồng bộ khi số xu đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverCoins]);

  // Đóng bảng thì xoá lỗi nhận xu cũ (điều chỉnh state ngay khi render, không dùng effect)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setClaimError(null);
  }

  if (!isOpen) return null;

  async function handleClaim() {
    if (isClaiming || !status || status.hasClaimedToday || !status.enabled) return;

    setIsClaiming(true);
    setClaimError(null);

    try {
      const res = await claimDailyReward();
      updateCoins(res.userCoins);

      queryClient.setQueryData<DailyRewardStatus>(queryKey, (prev) =>
        prev
          ? {
              ...prev,
              hasClaimedToday: true,
              userCoins: res.userCoins,
              claimedDays: [...prev.claimedDays, res.dayIndex],
            }
          : prev,
      );

      onRewardClaimed?.(res.coinsEarned, res.userCoins);
    } catch (err: unknown) {
      setClaimError(getErrorMessage(err, "Không thể nhận xu lúc này. Vui lòng thử lại."));
      // Đồng bộ lại (vd: đã nhận ở tab khác) mà không xoá bảng đang hiển thị
      void statusQuery.refetch();
    } finally {
      setIsClaiming(false);
    }
  }

  const statusFailed = statusQuery.isError && !status;

  return (
    <div
      className="daily-reward-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="daily-reward-modal">
        {/* NÚT TẮT X */}
        <button
          type="button"
          className="daily-reward-modal__close-btn"
          onClick={onClose}
          aria-label="Đóng bảng nhận xu"
        >
          ✕
        </button>

        {/* TIÊU ĐỀ BẢNG PHONG CÁCH VINTAGE GOLD */}
        <div className="daily-reward-modal__header">
          <h2 className="daily-reward-modal__title">ĐĂNG NHẬP NHẬN XU HÀNG NGÀY</h2>
        </div>

        {!user ? (
          <div className="daily-reward-modal__disabled-box">
            <span className="daily-reward-modal__lock-icon">🔒</span>
            <p>Vui lòng đăng nhập để tham gia nhận xu điểm danh hàng ngày!</p>
            <Link
              href="/login?next=/lessons"
              className="daily-reward-claim-btn"
              style={{
                textDecoration: "none",
                display: "inline-block",
                marginTop: 14,
                padding: "10px 24px",
                textAlign: "center",
              }}
              onClick={onClose}
            >
              ĐĂNG NHẬP NGAY
            </Link>
          </div>
        ) : statusFailed ? (
          <ErrorState
            compact
            title="Không tải được bảng điểm danh"
            message={getErrorMessage(statusQuery.error, "Đã xảy ra sự cố khi tải dữ liệu điểm danh.")}
            isRetrying={statusQuery.isFetching}
            onRetry={() => void statusQuery.refetch()}
          />
        ) : !status ? (
          // Đang tải: giữ nguyên khung 7 ngày bằng skeleton
          <div className="daily-reward-grid" aria-busy="true" aria-label="Đang tải thông tin kho báu">
            {SKELETON_DAYS.map((dayNum) => (
              <div
                key={dayNum}
                className={`daily-reward-card daily-reward-card--locked daily-reward-card--skeleton${dayNum === 7 ? " daily-reward-card--big" : ""}`}
                aria-hidden="true"
              >
                <div className="daily-reward-card__head">
                  <span className="daily-reward-card__day">
                    {dayNum === 7 ? "NGÀY 7 ★" : `NGÀY ${dayNum}`}
                  </span>
                </div>
                <div className="daily-reward-card__coin-box">
                  <span className="daily-reward-card__coin-icon">
                    {dayNum === 7 ? "👑" : <CoinIcon />}
                  </span>
                  <span className="daily-reward-card__amount">…</span>
                  <span className="daily-reward-card__unit">XU</span>
                </div>
              </div>
            ))}
          </div>
        ) : !status.enabled ? (
          <div className="daily-reward-modal__disabled-box">
            <span className="daily-reward-modal__lock-icon">🔒</span>
            <p>Tính năng điểm danh nhận xu hiện đang tạm đóng bởi Quản trị viên.</p>
          </div>
        ) : (
          <>
            {/* LƯỚI 7 NGÀY NHẬN XU */}
            <div className="daily-reward-grid">
              {status.dayRewards.map((rewardAmount, idx) => {
                const dayNum = idx + 1;
                const isClaimed = status.claimedDays.includes(dayNum);
                const isToday = dayNum === status.currentDayIndex;
                const isTodayUnclaimed = isToday && !isClaimed;
                const isLocked = !isClaimed && !isToday;

                return (
                  <div
                    key={dayNum}
                    className={`daily-reward-card${isClaimed ? " daily-reward-card--claimed" : ""}${isTodayUnclaimed ? " daily-reward-card--today" : ""}${isLocked ? " daily-reward-card--locked" : ""}${dayNum === 7 ? " daily-reward-card--big" : ""}`}
                    onClick={isTodayUnclaimed ? handleClaim : undefined}
                    style={{ cursor: isTodayUnclaimed ? "pointer" : "default" }}
                    title={isTodayUnclaimed ? "Bấm vào để nhận xu hôm nay" : undefined}
                  >
                    <div className="daily-reward-card__head">
                      <span className="daily-reward-card__day">
                        {dayNum === 7 ? "NGÀY 7 ★" : `NGÀY ${dayNum}`}
                      </span>
                      {isClaimed && (
                        <span className="daily-reward-card__badge daily-reward-card__badge--claimed">
                          ✓ ĐÃ NHẬN
                        </span>
                      )}
                      {isTodayUnclaimed && (
                        <span className="daily-reward-card__badge daily-reward-card__badge--today">
                          HÔM NAY
                        </span>
                      )}
                    </div>

                    <div className="daily-reward-card__coin-box">
                      <span className="daily-reward-card__coin-icon">
                        {dayNum === 7 ? "👑" : <CoinIcon />}
                      </span>
                      <span className="daily-reward-card__amount">+{rewardAmount}</span>
                      <span className="daily-reward-card__unit">XU</span>
                    </div>

                    {isTodayUnclaimed && (
                      <span className="daily-reward-card__tap-hint">
                        👉 Bấm nhận
                      </span>
                    )}

                    {isLocked && (
                      <span className="daily-reward-card__lock-hint">Chưa mở</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PHẦN CHÂN MODAL & NÚT NHẬN */}
            <div className="daily-reward-modal__footer">
              {claimError && (
                <div className="daily-reward-modal__error" role="alert">
                  {claimError}
                </div>
              )}
              <div className="daily-reward-modal__action-wrap">
                {status.hasClaimedToday ? (
                  <button
                    type="button"
                    className="daily-reward-modal__btn daily-reward-modal__btn--done"
                    disabled
                  >
                    <span className="daily-reward-modal__btn-text">
                      ✓ Đã nhận
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="daily-reward-modal__btn daily-reward-modal__btn--claim"
                    onClick={handleClaim}
                    disabled={isClaiming}
                  >
                    <span className="daily-reward-modal__btn-text">
                      {isClaiming
                        ? "Đang nhận..."
                        : claimError
                          ? `Thử nhận lại +${status.todayReward} xu`
                          : `Nhận +${status.todayReward} xu`}
                    </span>
                  </button>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
