import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { getAdminSession } from "@/modules/auth/server/admin-session";
import { AdminView } from "./admin-view";
import { adminPage, adminTabs } from "./admin.const";
import type { AdminTab } from "./admin.const";
import "./admin.scss";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export const dynamic = "force-dynamic";

async function generateMetadata(): Promise<Metadata> {
  const session = await getAdminSession();
  if (session.status !== "granted") {
    return {
      title: "404 - Không tìm thấy trang",
      robots: { index: false, follow: false },
    };
  }

  return buildMetadata("/admin", {
    title: adminPage.title,
    description: adminPage.description,
  });
}

function isAdminTab(value: string | undefined): value is AdminTab {
  return (
    value === adminTabs.overview ||
    value === adminTabs.rooms ||
    value === adminTabs.lessons ||
    value === adminTabs.users ||
    value === adminTabs.articles ||
    value === adminTabs.coins ||
    value === adminTabs.social ||
    value === adminTabs.cart
  );
}

async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAdminSession();

  // Nếu người dùng không có role là admin (chưa đăng nhập hoặc role !== "ADMIN"), luôn là trang 404
  if (session.status !== "granted") {
    notFound();
  }

  const { tab } = await searchParams;
  const initialTab = isAdminTab(tab) ? tab : adminTabs.overview;

  return (
    <div className="admin-shell">
      <AdminView user={session.user} initialTab={initialTab} />
    </div>
  );
}

export default AdminPage;
export { generateMetadata };
export type { AdminPageProps };
