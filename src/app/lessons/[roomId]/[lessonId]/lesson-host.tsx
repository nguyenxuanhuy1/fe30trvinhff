"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InventoryView } from "@/modules/inventory";
import { lessonPage } from "../../lessons.const";
import { LessonCompleteBridge } from "./lesson-complete-bridge";
import { useGameLesson, type LessonDetail } from "@/modules/lessons";
import { ErrorState, GameCardSkeleton } from "@/components/ui";

interface LessonHostProps {
  roomId: string;
  lessonId: string;
  lesson?: LessonDetail | null;
}

export function LessonHost({ roomId, lessonId, lesson: initialLesson }: LessonHostProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"inventory" | "play">("inventory");

  const { lesson, isLoading, error, refetch } = useGameLesson({
    lessonId,
    initialLesson,
  });

  if (isLoading && !lesson) {
    return (
      <main className="lesson-player lesson-player--loading">
        <header className="lesson-player__header">
          <div className="lesson-player__left">
            <Link className="lesson-player__back-btn" href={`/lessons/${roomId}`} aria-label="Quay lại">
              <svg
                className="lesson-player__back-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
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
          <h1 className="lesson-player__title">Đang nạp trò chơi...</h1>
          <div className="lesson-player__right" />
        </header>
        <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
          <GameCardSkeleton count={1} variant="lesson" />
        </div>
      </main>
    );
  }

  if (error && !lesson) {
    return (
      <main className="lesson-player">
        <header className="lesson-player__header">
          <div className="lesson-player__left">
            <Link className="lesson-player__back-btn" href={`/lessons/${roomId}`} aria-label="Quay lại">
              <span>Quay lại</span>
            </Link>
          </div>
        </header>
        <div style={{ padding: "2rem" }}>
          <ErrorState
            error={error}
            message="Không thể tải nội dung trò chơi. Vui lòng thử lại."
            onRetry={() => void refetch()}
          />
        </div>
      </main>
    );
  }

  if (!lesson) {
    return null;
  }

  if (phase === "inventory") {
    return (
      <InventoryView
        mode="pre-lesson"
        onEnterGame={() => setPhase("play")}
        onBack={() => router.push(`/lessons/${roomId}`)}
        enterGameText="Vào chơi"
      />
    );
  }

  return (
    <main className="lesson-player">
      <header className="lesson-player__header">
        <div className="lesson-player__left">
          <Link className="lesson-player__back-btn" href={`/lessons/${roomId}`} aria-label="Quay lại">
            <svg
              className="lesson-player__back-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
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

        <h1 className="lesson-player__title" title={lesson.name}>
          {lesson.name}
        </h1>

        <div className="lesson-player__right" />
      </header>

      <div className="lesson-player__stage">
        <LessonCompleteBridge
          lessonId={lessonId}
          lessonName={lesson.name}
          html={lesson.html}
          frameId="lesson-player-frame"
          emptyText={lessonPage.emptyHtml}
          roomId={roomId}
        />
      </div>
    </main>
  );
}
