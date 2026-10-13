"use client";

import Image from "next/image";
import type { Group, SentInvitation } from "@/modules/friends/types";
import { friendsPage } from "../friends.const";
import "./group-panel.scss";

const FALLBACK = "/images/chuotuser.png";

interface GroupPanelProps {
  group: Group;
  currentUserId: string;
  sentInvitations: SentInvitation[];
}

function GroupPanel({ group, currentUserId, sentInvitations }: GroupPanelProps) {
  const isOwner = group.ownerId === currentUserId;

  return (
    <div className="group-panel">
      <div className="group-panel__head">
        <div className="group-panel__title">
          <h3 className="group-panel__name">{group.name}</h3>
          <span className="group-panel__count">
            {friendsPage.members(group.members.length)}
          </span>
        </div>
        <span className="group-panel__badge">
          {isOwner ? friendsPage.badges.owner : friendsPage.badges.member}
        </span>
      </div>

      <p className="group-panel__hint">
        {isOwner ? friendsPage.hints.ownerOnly : friendsPage.hints.oneGroupOnly}
      </p>

      <ul className="group-panel__members">
        {group.members.map((member) => (
          <li className="group-panel__member" key={member.id}>
            <span className="group-panel__member-avatar">
              <Image
                className="group-panel__member-image"
                src={member.user.avatarUrl ?? FALLBACK}
                alt={`Avatar của ${member.user.username}`}
                width={36}
                height={36}
                unoptimized
              />
            </span>
            <span className="group-panel__member-info">
              <span className="group-panel__member-name">{member.user.username}</span>
              <span className="group-panel__member-since">
                {friendsPage.memberSince(member.joinedAt)}
              </span>
            </span>
            {member.role === "OWNER" && (
              <span className="group-panel__member-badge">
                {friendsPage.badges.owner}
              </span>
            )}
          </li>
        ))}
      </ul>

      {sentInvitations.length > 0 && (
        <div className="group-panel__sent">
          <h4 className="group-panel__sent-title">{friendsPage.sections.sent}</h4>
          <ul className="group-panel__sent-list">
            {sentInvitations.map((invitation) => (
              <li className="group-panel__sent-item" key={invitation.id}>
                {invitation.invitee.username}
                <span className="group-panel__sent-badge">{friendsPage.badges.invited}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { GroupPanel };
export type { GroupPanelProps };
