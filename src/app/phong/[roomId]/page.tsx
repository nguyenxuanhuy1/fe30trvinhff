import { redirect } from "next/navigation";

export default async function RoomLessonsPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  redirect(`/lessons/${roomId}`);
}
