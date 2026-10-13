"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Result, Skeleton, Space, Spin, Tag, message } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/modules/auth";
import {
  CameraPreview,
  InventoryView,
  ItemGrid,
  enterLab,
  listLessons,
  saveLabResult,
  slotLabels,
  useCatalog,
  useEquippedItems,
  useInventory,
  useItemPreload,
} from "@/modules/inventory";
import type {
  CameraPreviewApi,
  ItemSlot,
  LabEnterResponse,
} from "@/modules/inventory";
import { waitingRoom } from "./waiting-room.const";
import "./lab-host.scss";
import "./waiting-room.scss";

// Tin nhắn bài học gửi lên host
interface CompleteMessage {
  type: "COMPLETE";
  result?: unknown;
}

// Chỉ nhận message từ chính bài học trong iframe của trang này: vừa check origin
// vừa check source, để trang khác không giả vờ nộp kết quả.
function isTrustedComplete(event: MessageEvent, frame: HTMLIFrameElement | null): boolean {
  if (!frame || frame.contentWindow !== event.source) {
    return false;
  }

  return event.origin === window.location.origin;
}

/**
 * Sảnh chờ + phiên thí nghiệm.
 *
 * Trang này giữ 2 giai đoạn trong cùng route:
 *   lobby -> tủ đồ trái, camera thử đồ phải, bấm "Vào thí nghiệm"
 *   run  -> iframe bài học toàn màn hình
 *
 * Không mặc đồ vẫn vào được: server đã bỏ kiểm tra requiredSlots, requiredSlots
 * chỉ còn là gợi ý hiển thị. Đồ đã mặc được truyền cho bài qua INIT.
 */
function LabHost({ slug }: { slug: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const previewApiRef = useRef<CameraPreviewApi | null>(null);

  const [status, setStatus] = useState<"checking" | "ready" | "error">("checking");
  const [errorText, setErrorText] = useState("");
  const [session, setSession] = useState<LabEnterResponse | null>(null);
  const [phase, setPhase] = useState<"lobby" | "run">("lobby");

  const catalogQuery = useCatalog();
  const inventoryQuery = useInventory();
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const { equippedItems, equipped } = useEquippedItems(catalog);
  const owned = useMemo(
    () => inventoryQuery.inventory?.owned ?? [],
    [inventoryQuery.inventory?.owned],
  );

  // requiredSlots của bài đang mở, chỉ để nhắc người chơi nên mặc gì
  const lessonQuery = useQuery({
    queryKey: ["lab-lessons"],
    queryFn: listLessons,
    staleTime: 60_000,
    enabled: phase === "lobby",
  });

  const suggestedSlots = useMemo(() => {
    const lessons = lessonQuery.data ?? [];
    const lesson = lessons.find((entry) => entry.slug === slug || entry.id === slug);
    return (lesson?.requiredSlots ?? []) as ItemSlot[];
  }, [lessonQuery.data, slug]);

  const missing = useMemo(() => {
    const worn = new Set(equippedItems.map((item) => item.slot));
    return suggestedSlots.filter((slot) => !worn.has(slot));
  }, [equippedItems, suggestedSlots]);

  // Tải trước ảnh đồ đang mặc để mở camera không bị trễ ảnh
  useItemPreload(equipped);

  useEffect(() => {
    let cancelled = false;

    async function enter() {
      try {
        const data = await enterLab(slug);
        if (cancelled) return;
        setSession(data);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;

        const response = (
          error as {
            response?: { status?: number; data?: { message?: string } };
          }
        ).response;

        if (response?.status === 401) {
          setErrorText("Bạn cần đăng nhập để vào bài học này.");
        } else {
          setErrorText(
            response?.data?.message || "Không vào được phòng thí nghiệm.",
          );
        }

        setStatus("error");
      }
    }

    void enter();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSubmit = useCallback(
    async (result: unknown) => {
      if (!session) return;

      try {
        await saveLabResult(session.labToken, result ?? {});
        void messageApi.success("Đã ghi nhận kết quả của bạn.");
      } catch (error) {
        const text =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Không lưu được kết quả.";
        void messageApi.error(text);
      }
    },
    [messageApi, session],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as CompleteMessage | { type: string } | null;

      if (!data) return;
      if (data.type === "NAVIGATE_BACK") {
        router.push("/lessons");
        return;
      }
      if (data.type !== "COMPLETE" && data.type !== "LESSON_COMPLETE") return;
      if (!isTrustedComplete(event, frameRef.current)) return;

      void handleSubmit((data as CompleteMessage).result);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [handleSubmit, router]);

  // Bài học chỉ biết đồ đang mặc sau khi host hỏi server xong
  const handleFrameLoad = useCallback(() => {
    if (!session) return;

    let latestEquipped: string[] = session.equipped || [];
    try {
      const stored = localStorage.getItem("equipped_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          latestEquipped = parsed;
        }
      }
      const retro = localStorage.getItem("retro_equipped_items");
      if (retro) {
        const parsedRetro = JSON.parse(retro);
        if (parsedRetro && typeof parsedRetro === "object") {
          const ids = Object.values(parsedRetro).filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          );
          if (ids.length > 0) {
            latestEquipped = ids;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to read latest equipped items:", e);
    }

    const payload = {
      type: "INIT",
      equipped: latestEquipped,
      avatarUrl: user?.inventoryAvatarUrl || null,
    };

    frameRef.current?.contentWindow?.postMessage(
      payload,
      window.location.origin,
    );
  }, [session, user?.inventoryAvatarUrl]);

  const handleEnter = useCallback(() => {
    // Nhả camera sảnh chờ trước, nếu không bài thí nghiệm mở camera ngay sau đó
    // sẽ không lấy được (thiết bị chỉ nhận 1 stream ở một lúc)
    previewApiRef.current?.release();
    setPhase("run");
  }, []);

  const handleError = useCallback(
    (text: string) => {
      void messageApi.error(text);
    },
    [messageApi],
  );

  if (status === "checking") {
    return (
      <div className="lab-host lab-host--center">
        <Spin size="large" />
        <p className="lab-host__checking-text">Đang chuẩn bị phòng thí nghiệm...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <Result
        status="warning"
        title="Không vào được bài học"
        subTitle={errorText}
        extra={
          <Space>
            <Button type="primary" href="/lessons">
              Về danh sách bài
            </Button>
          </Space>
        }
      />
    );
  }

  if (!session) return null;

  if (phase === "run") {
    return (
      <div className="lab-host">
        {contextHolder}
        <iframe
          className="lab-host__frame"
          ref={frameRef}
          src={session.lessonPath}
          title="Nội dung bài thí nghiệm"
          allow="camera; microphone; fullscreen"
          onLoad={handleFrameLoad}
        />
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <InventoryView
        mode="pre-lesson"
        onEnterGame={handleEnter}
        onBack={() => router.push("/lessons")}
        enterGameText="Vào chơi"
      />
    </>
  );
}

export { LabHost };
