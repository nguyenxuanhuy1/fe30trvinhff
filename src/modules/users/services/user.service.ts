import { api } from "@/lib/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  CreateUserPayload,
  GenderStats,
  UpdateUserPayload,
  User,
  UserListParams,
  UserListResult,
  UserRoleValue,
} from "../types";

async function getUsers(params: UserListParams = {}): Promise<UserListResult> {
  const keyword = params.keyword?.trim();

  const res = await api.get<PaginatedResponse<User>>("/users", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      role: params.role,
      username: keyword || undefined,
    },
  });
  return { data: res.data.data, meta: res.data.meta };
}

async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await api.post<{ data: User }>("/users", payload);
  return res.data.data;
}

async function updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
  const res = await api.put<{ data: User }>(`/users/${id}`, payload);
  return res.data.data;
}

async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

async function updateUserRole(id: string, role: UserRoleValue): Promise<User> {
  const res = await api.put<{ data: User }>(`/users/${id}`, { role });
  return res.data.data;
}

async function getGenderStats(): Promise<GenderStats> {
  const res = await api.get<{ data: GenderStats }>("/users/stats/gender");
  return res.data.data;
}

async function getAdminOverviewStats(): Promise<import("../types").AdminOverviewStats> {
  const res = await api.get<{ data: import("../types").AdminOverviewStats }>("/users/stats/overview");
  return res.data.data;
}

export {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getGenderStats,
  getAdminOverviewStats,
};

