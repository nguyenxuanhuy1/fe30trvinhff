"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEquipStore } from "@/stores/equip-store";
import { api } from "@/lib/api/client";
import { useAuth } from "@/modules/auth";

/**
 * Sân khấu bài học + cầu nối hoàn thành màn.
 *
 * QUY ƯỚC BÁO HOÀN THÀNH:
 *   Bài học trong iframe gửi cho trang chủ:
 *     parent.postMessage({ type: "LESSON_COMPLETE", score?: number }, "*")
 *     hoặc parent.postMessage({ type: "COMPLETE", result?: { score?: number } }, "*")
 *
 *   ĐIỀU KIỆN HOÀN THÀNH:
 *     Người dùng phải hoàn thành trên 70% bài học (score > 70%) thì mới tính hoàn thành.
 *     Nếu score <= 70% -> Thất bại, không ghi nhận hoàn thành, hiển thị thông báo thử lại.
 */

interface LessonCompleteBridgeProps {
  lessonId: string;
  lessonName: string;
  html: string;
  /** id của iframe, dùng để đối chiếu event.source */
  frameId: string;
  emptyText: string;
  roomId?: string;
}

type Completion =
  | { state: "done"; rewards: number[]; coinsEarned: number; totalCoins?: number; score: number }
  | { state: "already"; coinsEarned: number; score: number }
  | { state: "failed_score"; score: number; requiredScore: number }
  | { state: "failed"; text: string; score?: number };

const COMPLETE_MESSAGE = "LESSON_COMPLETE";
const PASS_THRESHOLD = 70; // Yêu cầu trên 70% (> 70%)

function parseScorePercentage(data: unknown): number {
  if (!data || typeof data !== "object") return 100;
  const d = data as Record<string, any>;
  const res = d.result && typeof d.result === "object" ? d.result : {};

  // 1. Kiểm tra trường tỷ lệ / phần trăm / độ chính xác trực tiếp
  const pct =
    d.percentage ??
    d.scorePercentage ??
    d.accuracy ??
    d.accuracyPct ??
    res.percentage ??
    res.scorePercentage ??
    res.accuracy ??
    res.accuracyPct ??
    d.details?.accuracyPct ??
    res.details?.accuracyPct ??
    d.completedRatio ??
    res.completedRatio;

  if (typeof pct === "number" && !isNaN(pct)) {
    return pct <= 1 && pct > 0 ? Math.round(pct * 100) : Math.round(pct);
  }

  // 2. Kiểm tra điểm số với maxScore / total
  const rawScore =
    typeof d.score === "number"
      ? d.score
      : typeof res.score === "number"
      ? res.score
      : null;

  const maxScore =
    typeof d.maxScore === "number"
      ? d.maxScore
      : typeof d.totalScore === "number"
      ? d.totalScore
      : typeof d.total === "number"
      ? d.total
      : typeof res.maxScore === "number"
      ? res.maxScore
      : typeof res.totalScore === "number"
      ? res.totalScore
      : typeof res.total === "number"
      ? res.total
      : null;

  if (rawScore !== null && !isNaN(rawScore)) {
    if (maxScore !== null && maxScore > 0) {
      return Math.round((rawScore / maxScore) * 100);
    }
    // Nếu điểm dạng 0 - 1 (ví dụ 0.85 = 85%)
    if (rawScore <= 1 && rawScore > 0) {
      return Math.round(rawScore * 100);
    }
    return Math.round(rawScore);
  }

  // Nếu bài học kết thúc mà không truyền kèm số điểm, mặc định coi như 100%
  return 100;
}

function getInitialEquipped(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const retro = window.localStorage.getItem("retro_equipped_items");
    if (retro) {
      const parsed = JSON.parse(retro);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const ids = Object.values(parsed).filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        );
        if (ids.length > 0) return ids;
      }
    }
    const simple = window.localStorage.getItem("equipped_items");
    if (simple) {
      const parsed = JSON.parse(simple);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
      }
    }
  } catch {}
  return [];
}

function LessonCompleteBridge({
  lessonId,
  lessonName,
  html,
  frameId,
  emptyText,
  roomId,
}: LessonCompleteBridgeProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const sentRef = useRef(false);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const storeEquipped = useEquipStore((state) => state.equipped);
  const [localEquipped, setLocalEquipped] = useState<string[]>(getInitialEquipped);

  useEffect(() => {
    setLocalEquipped(getInitialEquipped());
  }, []);

  const activeEquipped = storeEquipped.length > 0 ? storeEquipped : localEquipped;

  const sendInitToFrame = useCallback(() => {
    if (!frameRef.current?.contentWindow) return;
    const currentEquipped = getInitialEquipped();
    const finalEquipped = currentEquipped.length > 0 ? currentEquipped : activeEquipped;
    const isCamOn =
      typeof window !== "undefined" &&
      window.localStorage.getItem("inventory_camera_mode") !== "off";
    try {
      frameRef.current.contentWindow.postMessage(
        { type: "INIT", equipped: finalEquipped, camera: isCamOn },
        "*",
      );
    } catch (e) {
      console.warn("[LessonCompleteBridge] postMessage INIT error:", e);
    }
  }, [activeEquipped]);

  const { updateCoins } = useAuth();

  const handleReplay = useCallback(() => {
    sentRef.current = false;
    setCompletion(null);
    setSubmitting(false);
    setReplayKey((k) => k + 1);
  }, []);

  const submit = useCallback(
    async (achievedScore: number) => {
      if (sentRef.current) {
        return;
      }

      sentRef.current = true;
      setSubmitting(true);

      try {
        const res = await api.post<{
          data: {
            rewards: number[];
            coinsEarned?: number;
            alreadyRewarded?: boolean;
            userCoins?: number;
            message?: string;
          };
        }>(`/levels/${lessonId}/complete`, { score: achievedScore });

        const data = res.data.data;
        if (data.userCoins !== undefined) {
          updateCoins(data.userCoins);
        }

        if (data.coinsEarned && data.coinsEarned > 0) {
          setCompletion({
            state: "done",
            rewards: data.rewards ?? [],
            coinsEarned: data.coinsEarned,
            totalCoins: data.userCoins,
            score: achievedScore,
          });
        } else {
          setCompletion({
            state: "already",
            coinsEarned: 0,
            score: achievedScore,
          });
        }
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;

        if (status === 409) {
          // Đã nhận thưởng rồi thì không phải lỗi, chỉ báo lại cho người học
          setCompletion({ state: "already", coinsEarned: 0, score: achievedScore });
        } else {
          sentRef.current = false;
          setCompletion({
            state: "failed",
            text:
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              "Không ghi được kết quả, thử lại sau.",
            score: achievedScore,
          });
          setSubmitting(false);
        }
      }
    },
    [lessonId, updateCoins],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Hỗ trợ cả same origin và null origin của srcDoc sandbox
      if (event.origin !== window.location.origin && event.origin !== "null") {
        return;
      }

      if (event.source !== frameRef.current?.contentWindow) {
        return;
      }

      const data = event.data as { type?: unknown } | null;

      if (!data || (data.type !== COMPLETE_MESSAGE && data.type !== "COMPLETE")) {
        return;
      }

      // Trích xuất điểm số phần trăm bài học
      const scorePercentage = parseScorePercentage(data);

      // ĐIỀU KIỆN: Người dùng phải hoàn thành trên 70% bài học (> 70)
      if (scorePercentage <= PASS_THRESHOLD) {
        setCompletion({
          state: "failed_score",
          score: scorePercentage,
          requiredScore: PASS_THRESHOLD,
        });
        return;
      }

      void submit(scorePercentage);
    }

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [submit]);

  // Gửi lại INIT nếu danh sách đồ đang mặc thay đổi
  useEffect(() => {
    sendInitToFrame();
  }, [sendInitToFrame]);

  const processedHtml = useMemo(() => {
    if (!html || html.trim().length === 0) return html;
    const fullscreenOverride = `
<style id="lab-sdk-fullscreen-override">
  html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
  #stage, .stage { width: 100% !important; height: 100% !important; max-width: none !important; }
</style>
`;
    if (html.includes("</head>")) {
      return html.replace("</head>", `${fullscreenOverride}</head>`);
    }
    return `${fullscreenOverride}${html}`;
  }, [html]);

  if (html.trim().length === 0) {
    return <p className="lesson-player__empty">{emptyText}</p>;
  }

  const backUrl = roomId ? `/lessons/${roomId}` : "/lessons";

  return (
    <>
      <iframe
        key={replayKey}
        id={frameId}
        ref={frameRef}
        className="lesson-player__frame"
        title={lessonName}
        srcDoc={processedHtml}
        onLoad={sendInitToFrame}
        style={completion !== null ? { pointerEvents: "none" } : undefined}
        // Cấp quyền camera và microphone cho các bài học cần hand tracking
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        allow="camera; microphone; fullscreen"
      />

      {completion !== null && (
        <div className="lesson-player__result" role="dialog" aria-modal="true">
          <div className={`lesson-result-card lesson-result-card--${completion.state}`}>
            {/* Huy hiệu 3D nổi bật */}
            <div
              className={`lesson-result-card__badge lesson-result-card__badge--${
                completion.state === "failed_score"
                  ? "fail"
                  : completion.state === "failed"
                  ? "warn"
                  : "success"
              }`}
            >
              {completion.state === "failed_score" ? (
                <span className="lesson-result-card__badge-icon">✕</span>
              ) : completion.state === "failed" ? (
                <span className="lesson-result-card__badge-icon">!</span>
              ) : (
                <span className="lesson-result-card__badge-icon">★</span>
              )}
            </div>

            {/* Tiêu đề trạng thái */}
            <h2 className="lesson-result-card__title">
              {completion.state === "failed_score"
                ? "CHƯA HOÀN THÀNH"
                : completion.state === "failed"
                ? "CHƯA GHI ĐƯỢC KẾT QUẢ"
                : "HOÀN THÀNH BÀI HỌC!"}
            </h2>

            {/* Tên màn chơi */}
            <p className="lesson-result-card__lesson-name">{lessonName}</p>

            {/* Bảng điểm hoàn thành & thanh tiến độ */}
            {"score" in completion && completion.score !== undefined && (
              <div className="lesson-result-card__score-panel">
                <div className="lesson-result-card__score-row">
                  <span className="lesson-result-card__score-label">Điểm hoàn thành:</span>
                  <span
                    className={`lesson-result-card__score-value lesson-result-card__score-value--${
                      completion.state === "failed_score" ? "fail" : "pass"
                    }`}
                  >
                    {completion.score}%
                  </span>
                </div>

                <div className="lesson-result-card__progress-wrap">
                  <div className="lesson-result-card__progress-track">
                    <div
                      className={`lesson-result-card__progress-fill lesson-result-card__progress-fill--${
                        completion.state === "failed_score" ? "fail" : "pass"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, completion.score))}%` }}
                    />
                    <div
                      className="lesson-result-card__progress-threshold"
                      style={{ left: "70%" }}
                      title="Mốc hoàn thành: trên 70%"
                    >
                      <span className="lesson-result-card__threshold-label">70%</span>
                    </div>
                  </div>
                </div>

                <div className="lesson-result-card__tag-row">
                  {completion.state === "failed_score" ? (
                    <span className="lesson-result-card__tag lesson-result-card__tag--fail">
                      Chưa đạt (Yêu cầu trên 70%)
                    </span>
                  ) : (
                    <span className="lesson-result-card__tag lesson-result-card__tag--pass">
                      ✓ Đạt yêu cầu (&gt; 70%)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Thông điệp chi tiết */}
            <div className="lesson-result-card__message">
              {completion.state === "failed_score" && (
                <p>
                  Bạn cần hoàn thành <strong>trên 70%</strong> bài học mới có thể qua màn. Đừng nản lòng, hãy thử lại nhé!
                </p>
              )}

              {completion.state === "done" && (
                <p>
                  {completion.coinsEarned > 0 ? (
                    <>
                      🎉 Chúc mừng bạn đã hoàn thành bài học! Nhận được{" "}
                      <span className="lesson-result-card__coin-highlight">
                        +{completion.coinsEarned} Xu
                      </span>{" "}
                      vào tài khoản.
                    </>
                  ) : (
                    <>Chúc mừng bạn đã hoàn thành xuất sắc bài học!</>
                  )}
                </p>
              )}

              {completion.state === "already" && (
                <p>
                  Bạn đã hoàn thành bài học này trước đó! (Xu thưởng của bài học mỗi tài khoản chỉ nhận 1 lần duy nhất).
                </p>
              )}

              {completion.state === "failed" && (
                <p className="lesson-result-card__error-text">{completion.text}</p>
              )}
            </div>

            {/* Nhóm nút bấm phong cách Game Card */}
            <div className="lesson-result-card__actions">
              {completion.state === "failed_score" ? (
                <>
                  <button
                    type="button"
                    className="lesson-result-card__btn lesson-result-card__btn--retry"
                    onClick={handleReplay}
                  >
                    <span className="lesson-result-card__btn-icon">↺</span>
                    <span>Chơi lại</span>
                  </button>
                  <Link
                    href={backUrl}
                    className="lesson-result-card__btn lesson-result-card__btn--secondary"
                  >
                    <span>Về danh sách</span>
                  </Link>
                </>
              ) : completion.state === "failed" ? (
                <>
                  <button
                    type="button"
                    disabled={submitting}
                    className="lesson-result-card__btn lesson-result-card__btn--retry"
                    onClick={() => void submit(completion.score ?? 100)}
                  >
                    <span>{submitting ? "Đang gửi..." : "Thử lại"}</span>
                  </button>
                  <Link
                    href={backUrl}
                    className="lesson-result-card__btn lesson-result-card__btn--secondary"
                  >
                    <span>Về danh sách</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/inventory"
                    className="lesson-result-card__btn lesson-result-card__btn--inventory"
                  >
                    <span>Mở tủ đồ</span>
                  </Link>
                  <button
                    type="button"
                    className="lesson-result-card__btn lesson-result-card__btn--secondary"
                    onClick={handleReplay}
                  >
                    <span className="lesson-result-card__btn-icon">↺</span>
                    <span>Chơi lại</span>
                  </button>
                  <Link
                    href={backUrl}
                    className="lesson-result-card__btn lesson-result-card__btn--secondary"
                  >
                    <span>Về danh sách</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { LessonCompleteBridge };
