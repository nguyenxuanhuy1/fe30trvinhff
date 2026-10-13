import { redirect } from "next/navigation";

export default async function PhongLessonPage({
  params,
}: {
  params: Promise<{ roomId: string; lessonId: string }>;
}) {
  const { roomId, lessonId } = await params;
  redirect(`/lessons/${roomId}/${lessonId}`);
}
