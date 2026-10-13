type GroupMemberRole = "OWNER" | "MEMBER";
type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";
type InvitationAction = "ACCEPT" | "REJECT";

interface GroupMember {
  id: string;
  role: GroupMemberRole;
  joinedAt: string;
  hasLoggedInToday?: boolean;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    role: "ADMIN" | "MEMBER";
    streak?: number;
    lastLoginDate?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

interface Group {
  id: string;
  name: string;
  ownerId: string;
  streak?: number;
  actualStreak?: number;
  isFrozen?: boolean;
  allLoggedInToday?: boolean;
  lastStreakDate?: string | null;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
}

interface GroupBasic {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupInvitation {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeId: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt: string | null;
  group: GroupBasic;
  inviter: GroupMember["user"];
}

interface SentInvitation extends GroupInvitation {
  invitee: Pick<GroupMember["user"], "id" | "username" | "avatarUrl">;
}

interface FriendCandidate {
  id: string;
  username: string;
  avatarUrl: string | null;
  hasGroup: boolean;
  groupName: string | null;
  isMyGroupMember: boolean;
  isInvitedByMe: boolean;
}

interface FriendsOverview {
  group: Group | null;
  received: GroupInvitation[];
  sent: SentInvitation[];
}

export type {
  Group,
  GroupBasic,
  GroupMember,
  GroupMemberRole,
  GroupInvitation,
  SentInvitation,
  FriendCandidate,
  FriendsOverview,
  InvitationStatus,
  InvitationAction,
};
