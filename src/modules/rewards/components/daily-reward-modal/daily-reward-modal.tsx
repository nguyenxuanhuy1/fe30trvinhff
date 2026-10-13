"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/modules/auth";
import { claimDailyReward, getDailyRewardStatus } from "../../services/reward.service";
import type { DailyRewardStatus } from "../../types";
import "./daily-reward-modal.scss";

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (coinsEarned: number, totalCoins: number) => void;
}

export function DailyRewardModal({
  isOpen,
  onClose,
  onRewardClaimed,
}: DailyRewardModalProps) {
  const { user, updateCoins } = useAuth();
  const [status, setStatus] = useState<DailyRewardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!isOpen) return;
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadStatus() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDailyRewardStatus();
        if (isMounted) {
          setStatus(data);
          if (data.userCoins !== undefined) {
            updateCoins(data.userCoins);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : "Không thể tải trạng thái nhận xu";
          setError(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadStatus();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);


  if (!isOpen) return null;

  async function handleClaim() {
    if (isClaiming || !status || status.hasClaimedToday || !status.enabled) return;

    setIsClaiming(true);
    setError(null);

    try {
      const res = await claimDailyReward();
      updateCoins(res.userCoins);

      // Cập nhật lại status state
      setStatus((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          hasClaimedToday: true,
          userCoins: res.userCoins,
          claimedDays: [...prev.claimedDays, res.dayIndex],
        };
      });

      if (onRewardClaimed) {
        onRewardClaimed(res.coinsEarned, res.userCoins);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể nhận xu lúc này.";
      setError(msg);
    } finally {
      setIsClaiming(false);
    }
  }

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
          <div className="daily-reward-modal__icon-wrap">
            <span className="daily-reward-modal__chest">🪙</span>
          </div>
          <h2 className="daily-reward-modal__title">ĐĂNG NHẬP NHẬN XU HÀNG NGÀY</h2>
        </div>

        {/* THÔNG BÁO LỖI (NẾU CÓ) */}
        {error && <div className="daily-reward-modal__error">{error}</div>}

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
        ) : isLoading ? (
          <div className="daily-reward-modal__loading">
            <span className="daily-reward-modal__spinner" />
            <p>Đang tải thông tin kho báu...</p>
          </div>
        ) : !status ? (
          <div className="daily-reward-modal__error">Không thể tải dữ liệu điểm danh.</div>
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
                        {dayNum === 7 ? "👑" : "🪙"}
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
              <div className="daily-reward-modal__user-coins">
                <span>Số xu hiện tại:</span>
                <strong className="daily-reward-modal__coin-val">
                  🪙 {status.userCoins} Xu
                </strong>
              </div>

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
