import { LevelLessonsView } from "./level-lessons-view";

interface LevelLessonsPageProps {
  params: Promise<{ roomId: string }>;
}

export const dynamic = "force-dynamic";

async function LevelLessonsPage({ params }: LevelLessonsPageProps) {
  const { roomId } = await params;

  return (
    <main>
      <LevelLessonsView roomId={roomId} />
    </main>
  );
}

export default LevelLessonsPage;
