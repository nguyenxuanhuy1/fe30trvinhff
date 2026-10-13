import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getRoom } from "@/modules/lessons";
import { LevelLessonsView } from "./level-lessons-view";

interface LevelLessonsPageProps {
  params: Promise<{ roomId: string }>;
}

export const dynamic = "force-dynamic";

async function generateMetadata({
  params,
}: LevelLessonsPageProps): Promise<Metadata> {
  const { roomId } = await params;
  const room = await getRoom(roomId).catch(() => null);

  if (!room) {
    return buildMetadata(`/lessons/${roomId}`, {
      title: "Bài học trong cấp độ",
      description: "Danh sách các bài học thuộc cấp độ này.",
    });
  }

  return buildMetadata(`/lessons/${roomId}`, {
    title: `${room.name} — Bài học thí nghiệm`,
    description: `Danh sách các bài học thuộc ${room.name}.`,
  });
}

async function LevelLessonsPage({ params }: LevelLessonsPageProps) {
  const { roomId } = await params;

  return (
    <main>
      <LevelLessonsView roomId={roomId} />
    </main>
  );
}

export default LevelLessonsPage;
export { generateMetadata };
