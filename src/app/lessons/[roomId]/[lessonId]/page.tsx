import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { getLesson as getLessonOriginal } from "@/modules/lessons";
import { lessonPage } from "../../lessons.const";
import { LessonHost } from "./lesson-host";
import "./lesson-player.scss";

const getLesson = cache(getLessonOriginal);

interface LessonPlayerPageProps {
  params: Promise<{ roomId: string; lessonId: string }>;
}

export const dynamic = "force-dynamic";

async function generateMetadata({ params }: LessonPlayerPageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId).catch(() => null);

  if (lesson === null) {
    return buildMetadata(lessonPage.frameTitle, {
      title: lessonPage.notFound,
      description: lessonPage.notFound,
    });
  }

  return buildMetadata(`/lessons/${lesson.roomId}/${lessonId}`, {
    title: lesson.name,
    description: `Bài học ${lesson.name} trong phòng ${lesson.room.name}.`,
  });
}

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
export { generateMetadata };
