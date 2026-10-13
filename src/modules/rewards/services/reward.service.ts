import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  ClaimDailyRewardResult,
  DailyRewardConfig,
  DailyRewardStatus,
  UsersCoinsResponse,
} from "../types";

// Lấy trạng thái điểm danh nhận xu của user hiện tại
async function getDailyRewardStatus(): Promise<DailyRewardStatus> {
  const res = await api.get<ApiResponse<DailyRewardStatus>>("/daily-rewards/status");
  return res.data.data;
}

// Người dùng bấm nhận xu hôm nay
async function claimDailyReward(): Promise<ClaimDailyRewardResult> {
  const res = await api.post<ApiResponse<ClaimDailyRewardResult>>("/daily-rewards/claim");
  return res.data.data;
}

// Admin lấy cấu hình On/Off và xu 7 ngày
async function getDailyRewardConfig(): Promise<DailyRewardConfig> {
  const res = await api.get<ApiResponse<DailyRewardConfig>>("/daily-rewards/config");
  return res.data.data;
}

// Admin cập nhật On/Off và xu 7 ngày
async function updateDailyRewardConfig(payload: {
  enabled: boolean;
  dayRewards: number[];
}): Promise<DailyRewardConfig> {
  const res = await api.put<ApiResponse<DailyRewardConfig>>("/daily-rewards/config", payload);
  return res.data.data;
}

// Admin xem danh sách xu của người dùng
async function getUsersCoins(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<UsersCoinsResponse> {
  const res = await api.get<ApiResponse<UsersCoinsResponse>>("/daily-rewards/admin/users", {
    params,
  });
  return res.data.data;
}

// Admin cộng / trừ xu cho user
async function adjustUserCoins(payload: {
  userId: string;
  amount: number;
}): Promise<{
  userId: string;
  username: string;
  previousCoins: number;
  newCoins: number;
  delta: number;
}> {
  const res = await api.post<
    ApiResponse<{
      userId: string;
      username: string;
      previousCoins: number;
      newCoins: number;
      delta: number;
    }>
  >("/daily-rewards/admin/adjust", payload);
  return res.data.data;
}

export {
  getDailyRewardStatus,
  claimDailyReward,
  getDailyRewardConfig,
  updateDailyRewardConfig,
  getUsersCoins,
  adjustUserCoins,
};
