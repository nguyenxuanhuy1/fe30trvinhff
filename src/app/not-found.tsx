import Link from "next/link";

function NotFound() {
  return (
    <main className="status-page">
      <div className="status-page__content">
        <span className="status-page__code">404</span>
        <h1 className="status-page__title">Không tìm thấy trang</h1>
        <p className="status-page__description">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển.
        </p>
        <Link className="status-page__link" href="/lessons">
          Quay lại
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
