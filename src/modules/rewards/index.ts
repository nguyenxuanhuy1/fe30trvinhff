export { DailyRewardModal } from "./components/daily-reward-modal/daily-reward-modal";
export {
  getDailyRewardStatus,
  claimDailyReward,
  getDailyRewardConfig,
  updateDailyRewardConfig,
  getUsersCoins,
  adjustUserCoins,
} from "./services/reward.service";
export type {
  DailyRewardStatus,
  ClaimDailyRewardResult,
  DailyRewardConfig,
  UserCoinItem,
  UsersCoinsResponse,
} from "./types";
