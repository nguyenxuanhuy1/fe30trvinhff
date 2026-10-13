interface UserRole {
  ADMIN: "ADMIN";
  MEMBER: "MEMBER";
}

type UserRoleValue = UserRole[keyof UserRole];

type GenderValue = "MALE" | "FEMALE" | "OTHER";

interface UserGroupInfo {
  id: string;
  name: string;
  role?: string;
  isOwner?: boolean;
}

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  inventoryAvatarUrl?: string | null;
  gender?: GenderValue | null;
  role: UserRoleValue;
  coins?: number;
  streak?: number;
  lastLoginDate?: string | null;
  group?: UserGroupInfo | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    journalImages: number;
  };
}


interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  password: string;
  gender?: GenderValue;
}

interface UpdateProfilePayload {
  avatarUrl?: string | null;
  inventoryAvatarUrl?: string | null;
}

export type {
  User,
  UserGroupInfo,
  UserRole,
  UserRoleValue,
  GenderValue,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
};
