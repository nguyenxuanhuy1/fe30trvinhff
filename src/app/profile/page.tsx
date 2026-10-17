import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMe } from "@/modules/auth/services/auth.service";
import type { User } from "@/modules/auth/types";
import { ProfileView } from "./profile-view";
import "./profile.scss";

export const dynamic = "force-dynamic";

async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let initialUser: User | null = null;
  if (token) {
    try {
      initialUser = await getMe(token);
    } catch {
      // Không ném redirect ở server để tránh vòng lặp chuyển hướng vô tận (redirect loop).
      // AuthRouteGuard và AuthContext ở client sẽ tự làm mới token hoặc điều hướng an toàn.
    }
  }

  return <ProfileView initialUser={initialUser} />;
}

export default ProfilePage;
