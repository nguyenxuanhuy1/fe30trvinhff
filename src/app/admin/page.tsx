import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSession } from "@/modules/auth/server/admin-session";
import { AdminView } from "./admin-view";
import { adminTabs } from "./admin.const";
import type { AdminTab } from "./admin.const";
import "./admin.scss";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export const dynamic = "force-dynamic";

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
export type { AdminPageProps };
