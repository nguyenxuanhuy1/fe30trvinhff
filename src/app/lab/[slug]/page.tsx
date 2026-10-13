import type { Metadata } from "next";
import { LabHost } from "./lab-host";

export const metadata: Metadata = {
  // Bài học chạy trong iframe toàn màn hình, không muốn bị index
  robots: { index: false, follow: false },
};

interface LabPageProps {
  params: Promise<{ slug: string }>;
}

// lessonPath lấy từ DB sau khi server đã check đủ đồ, nên trang này phải
// dựng ở runtime.
export const dynamic = "force-dynamic";

async function LabPage({ params }: LabPageProps) {
  const { slug } = await params;

  return <LabHost slug={slug} />;
}

export default LabPage;
