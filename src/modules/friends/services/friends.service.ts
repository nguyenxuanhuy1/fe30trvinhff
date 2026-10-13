import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  FriendCandidate,
  FriendsOverview,
  Group,
  GroupInvitation,
  InvitationAction,
  SentInvitation,
} from "../types";

async function getMyGroup() {
  const res = await api.get<ApiResponse<Group | null>>("/groups/my");
  return res.data.data;
}

async function getFriendsOverview() {
  const [group, received, sent] = await Promise.all([
    getMyGroup(),
    getReceivedInvitations(),
    getSentInvitations(),
  ]);
  return { group, received, sent } satisfies FriendsOverview;
}

async function createGroup(name: string) {
  const res = await api.post<ApiResponse<Group>>("/groups", { name });
  return res.data.data;
}

async function searchFriends(keyword: string) {
  const res = await api.get<ApiResponse<FriendCandidate[]>>("/groups/friends/search", {
    params: { keyword },
  });
  return res.data.data;
}

async function inviteToGroup(groupId: string, inviteeId: string) {
  const res = await api.post<ApiResponse<GroupInvitation>>(`/groups/${groupId}/invitations`, {
    inviteeId,
  });
  return res.data.data;
}

async function getReceivedInvitations() {
  const res = await api.get<ApiResponse<GroupInvitation[]>>("/groups/invitations/received");
  return res.data.data;
}

async function getSentInvitations() {
  const res = await api.get<ApiResponse<SentInvitation[]>>("/groups/invitations/sent");
  return res.data.data;
}

async function respondToInvitation(id: string, action: InvitationAction) {
  const res = await api.patch<ApiResponse<GroupInvitation>>(`/groups/invitations/${id}`, { action });
  return res.data.data;
}

async function leaveGroup() {
  const res = await api.post<ApiResponse<{ message: string; disbanded: boolean }>>("/groups/leave");
  return res.data.data;
}

export {
  getMyGroup,
  getFriendsOverview,
  createGroup,
  searchFriends,
  inviteToGroup,
  getReceivedInvitations,
  getSentInvitations,
  respondToInvitation,
  leaveGroup,
};
