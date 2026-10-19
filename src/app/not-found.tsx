import Link from "next/link";
import { EmptyState } from "@/components/ui";
import "./not-found.scss";

export const metadata = {
  title: "404 - Không tìm thấy trang",
  description: "Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển.",
};

function NotFound() {
  return (
    <main className="not-found-page">
      <EmptyState
        icon="📜"
        title="Không tìm thấy trang (404)"
        description="Đường dẫn bạn truy cập hiện không tồn tại hoặc đã được di chuyển."
        action={
          <div className="not-found-actions">
            <Link href="/lessons" className="general-empty-card__btn">
              Về phòng bài học
            </Link>
            <Link href="/" className="general-empty-card__btn not-found-btn-sub">
              Trang chủ
            </Link>
          </div>
        }
      />
    </main>
  );
}

export default NotFound;
