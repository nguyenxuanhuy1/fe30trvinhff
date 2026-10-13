interface DailyRewardStatus {
  enabled: boolean;
  dayRewards: number[];
  hasClaimedToday: boolean;
  currentDayIndex: number;
  todayReward: number;
  userCoins: number;
  claimedDays: number[];
}

interface ClaimDailyRewardResult {
  success: boolean;
  dayIndex: number;
  coinsEarned: number;
  userCoins: number;
  message: string;
}

interface DailyRewardConfig {
  enabled: boolean;
  dayRewards: number[];
  updatedAt?: string;
}

interface UserCoinItem {
  id: string;
  username: string;
  role: string;
  coins: number;
  avatarUrl: string | null;
  createdAt: string;
  _count: {
    dailyCheckIns: number;
    lessonRewards: number;
  };
}

interface UsersCoinsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  users: UserCoinItem[];
}

export type {
  DailyRewardStatus,
  ClaimDailyRewardResult,
  DailyRewardConfig,
  UserCoinItem,
  UsersCoinsResponse,
};
