import type { User, UserRoleValue } from "@/modules/auth/types";

interface UserListMeta {
  page: number;
  pageSize: number;
  total: number;
}

interface UserListResult {
  data: User[];
  meta: UserListMeta;
}

interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: UserRoleValue;
}

interface UpdateUserRolePayload {
  role: UserRoleValue;
}

interface GenderStats {
  total: number;
  male: number;
  female: number;
  other: number;
  unspecified: number;
}

interface CreateUserPayload {
  username: string;
  password: string;
  role?: UserRoleValue;
  gender?: "MALE" | "FEMALE" | "OTHER";
  avatarUrl?: string;
}

interface UpdateUserPayload {
  username?: string;
  password?: string;
  role?: UserRoleValue;
  gender?: "MALE" | "FEMALE" | "OTHER";
  avatarUrl?: string;
}

interface RoomLessonStats {
  roomId: string;
  roomName: string;
  order: number;
  lessonCount: number;
}

interface AdminOverviewStats {
  totalUsers: number;
  gender: GenderStats;
  totalArticles: number;
  totalLessons: number;
  lessonsByRoom: RoomLessonStats[];
  specialOrdersCount: number;
  specialOrdersPending: number;
  specialOrdersCompleted: number;
  totalOrders: number;
}

export type {
  User,
  UserListMeta,
  UserListResult,
  UserListParams,
  UpdateUserRolePayload,
  UserRoleValue,
  GenderStats,
  CreateUserPayload,
  UpdateUserPayload,
  RoomLessonStats,
  AdminOverviewStats,
};

