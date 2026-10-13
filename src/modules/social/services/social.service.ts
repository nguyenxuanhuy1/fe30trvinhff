import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  SocialChannel,
  SocialProfile,
  SocialStat,
} from "../social.const";

interface SocialPageContent {
  profile: SocialProfile;
  stats: SocialStat[];
  channels: SocialChannel[];
}

interface AdminSocialPageContent extends SocialPageContent {
  updatedAt?: string;
}

async function getPublicSocialPage(): Promise<SocialPageContent> {
  const res = await api.get<ApiResponse<SocialPageContent>>("/social-page");
  return res.data.data;
}

async function getAdminSocialPage(): Promise<AdminSocialPageContent> {
  const res = await api.get<ApiResponse<AdminSocialPageContent>>("/social-page/admin");
  return res.data.data;
}

async function updateSocialPage(
  payload: SocialPageContent,
): Promise<AdminSocialPageContent> {
  const res = await api.put<ApiResponse<AdminSocialPageContent>>("/social-page/admin", payload);
  return res.data.data;
}

export { getAdminSocialPage, getPublicSocialPage, updateSocialPage };
export type { AdminSocialPageContent, SocialPageContent };
