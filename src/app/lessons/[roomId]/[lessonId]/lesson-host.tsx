"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InventoryView } from "@/modules/inventory";
import { lessonPage } from "../../lessons.const";
import { LessonCompleteBridge } from "./lesson-complete-bridge";
import type { LessonDetail } from "@/modules/lessons";

interface LessonHostProps {
  roomId: string;
  lessonId: string;
  lesson: LessonDetail;
}

export function LessonHost({ roomId, lessonId, lesson }: LessonHostProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"inventory" | "play">("inventory");

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
      <header className="lesson-player__bar">
        <Link className="lesson-player__back" href={`/lessons/${roomId}`}>
          {lessonPage.backLabel}
        </Link>
        <h1 className="lesson-player__title">{lesson.name}</h1>
        <span className="lesson-player__room">{lesson.room.name}</span>
      </header>

      <div className="lesson-player__stage">
        <LessonCompleteBridge
          lessonId={lessonId}
          lessonName={lesson.name}
          html={lesson.html}
          frameId="lesson-player-frame"
          emptyText={lessonPage.emptyHtml}
        />
      </div>
    </main>
  );
}
