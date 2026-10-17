import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson as getLessonOriginal } from "@/modules/lessons";
import { LessonHost } from "./lesson-host";
import "./lesson-player.scss";

const getLesson = cache(getLessonOriginal);

interface LessonPlayerPageProps {
  params: Promise<{ roomId: string; lessonId: string }>;
}

export const dynamic = "force-dynamic";

async function LessonPlayerPage({ params }: LessonPlayerPageProps) {
  const { roomId, lessonId } = await params;
  const lesson = await getLesson(lessonId).catch(() => null);

  if (lesson === null) {
    notFound();
  }

  return (
    <LessonHost
      roomId={roomId}
      lessonId={lessonId}
      lesson={lesson}
    />
  );
}

export default LessonPlayerPage;
