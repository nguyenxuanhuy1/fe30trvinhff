import { LessonHost } from "./lesson-host";
import "./lesson-player.scss";

interface LessonPlayerPageProps {
  params: Promise<{ roomId: string; lessonId: string }>;
}

export const dynamic = "force-dynamic";

/**
 * Không tải bài trên máy chủ nữa: trước đây mỗi lần mở bài, nội dung (~1-2MB) bị nhúng
 * thẳng vào trang nên trình duyệt không lưu lại được. Giờ LessonHost tự tải ở trình
 * duyệt: có bản lưu trên máy thì hiện ngay, đồng thời kiểm tra bản mới (xem useGameLesson).
 */
async function LessonPlayerPage({ params }: LessonPlayerPageProps) {
  const { roomId, lessonId } = await params;

  return <LessonHost roomId={roomId} lessonId={lessonId} />;
}

export default LessonPlayerPage;
