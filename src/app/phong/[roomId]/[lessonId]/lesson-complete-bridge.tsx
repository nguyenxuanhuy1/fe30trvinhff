"use client";

import { Button, Result } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEquipStore } from "@/stores/equip-store";
import { api } from "@/lib/api/client";

/**
 * Sân khấu bài học + cầu nối hoàn thành màn.
 *
 * QUY ƯỚC BÁO HOÀN THÀNH (bài học HTML tự báo, không có nút bấm):
 *   Bài học trong iframe gửi cho trang chủ:
 *     parent.postMessage({ type: "LESSON_COMPLETE", score?: number }, "*")
 *     hoặc parent.postMessage({ type: "COMPLETE", result?: { score?: number } }, "*")
 *   Player nghe thấy thì gọi POST /api/levels/:lessonId/complete để nhận đồ.
 */

interface LessonCompleteBridgeProps {
  lessonId: string;
  lessonName: string;
  html: string;
  /** id của iframe, dùng để đối chiếu event.source */
  frameId: string;
  emptyText: string;
}

type Completion =
  | { state: "done"; rewards: number[] }
  | { state: "already" }
  | { state: "failed"; text: string };

const COMPLETE_MESSAGE = "LESSON_COMPLETE";

function getInitialEquipped(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const retro = window.localStorage.getItem("retro_equipped_items");
    if (retro) {
      const parsed = JSON.parse(retro);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const ids = Object.values(parsed).filter((id): id is string => typeof id === "string" && id.length > 0);
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
}: LessonCompleteBridgeProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const sentRef = useRef(false);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const storeEquipped = useEquipStore((state) => state.equipped);
  const [localEquipped, setLocalEquipped] = useState<string[]>(getInitialEquipped);

  useEffect(() => {
    setLocalEquipped(getInitialEquipped());
  }, []);

  const activeEquipped = storeEquipped.length > 0 ? storeEquipped : localEquipped;

  const sendInitToFrame = useCallback(() => {
    if (!frameRef.current?.contentWindow) return;
    try {
      frameRef.current.contentWindow.postMessage(
        { type: "INIT", equipped: activeEquipped },
        "*",
      );
    } catch (e) {
      console.warn("[LessonCompleteBridge] postMessage INIT error:", e);
    }
  }, [activeEquipped]);

  const submit = useCallback(async () => {
    if (sentRef.current) {
      return;
    }

    sentRef.current = true;
    setSubmitting(true);

    try {
      const res = await api.post<{ data: { rewards: number[] } }>(`/levels/${lessonId}/complete`);
      setCompletion({ state: "done", rewards: res.data.data.rewards });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 409) {
        // Đã nhận đồ rồi thì không phải lỗi, chỉ báo lại cho người học
        setCompletion({ state: "already" });
      } else {
        sentRef.current = false;
        setCompletion({
          state: "failed",
          text:
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Không ghi được kết quả, thử lại sau.",
        });
        setSubmitting(false);
      }
    }
  }, [lessonId]);

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

      void submit();
    }

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [submit]);

  // Gửi lại INIT nếu danh sách đồ đang mặc thay đổi
  useEffect(() => {
    sendInitToFrame();
  }, [sendInitToFrame]);

  if (html.trim().length === 0) {
    return <p className="lesson-player__empty">{emptyText}</p>;
  }

  return (
    <>
      <iframe
        id={frameId}
        ref={frameRef}
        className="lesson-player__frame"
        title={lessonName}
        srcDoc={html}
        onLoad={sendInitToFrame}
        // Cấp quyền camera và microphone cho các bài học cần hand tracking
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        allow="camera; microphone; fullscreen"
      />

      {completion !== null && (
        <div className="lesson-player__result">
          {completion.state === "done" && (
            <Result
              status="success"
              title={`Đã hoàn thành: ${lessonName}`}
              subTitle={`Nhận được ${completion.rewards.length} món đồ mới.`}
              extra={[
                <Link key="inv" href="/inventory">
                  <Button type="primary">Mở tủ đồ</Button>
                </Link>,
                <Link key="lessons" href="/lessons">
                  <Button>Vào phòng thí nghiệm</Button>
                </Link>,
              ]}
            />
          )}

          {completion.state === "already" && (
            <Result
              status="info"
              title={`Đã hoàn thành: ${lessonName}`}
              subTitle="Bài này đã được thưởng đồ trước đó."
              extra={[
                <Link key="inv" href="/inventory">
                  <Button type="primary">Mở tủ đồ</Button>
                </Link>,
              ]}
            />
          )}

          {completion.state === "failed" && (
            <Result
              status="warning"
              title="Chưa ghi được kết quả"
              subTitle={completion.text}
              extra={
                <Button loading={submitting} onClick={() => void submit()} type="primary">
                  Thử lại
                </Button>
              }
            />
          )}
        </div>
      )}
    </>
  );
}

export { LessonCompleteBridge };
