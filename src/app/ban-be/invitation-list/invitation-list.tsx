"use client";

import Image from "next/image";
import type { GroupInvitation } from "@/modules/friends/types";
import { friendsPage } from "../friends.const";
import "./invitation-list.scss";

const FALLBACK = "/images/chuotuser.webp";

interface InvitationListProps {
  invitations: GroupInvitation[];
  pendingId: string | null;
  onAccept: (invitation: GroupInvitation) => void;
  onReject: (invitation: GroupInvitation) => void;
}

function InvitationList({
  invitations,
  pendingId,
  onAccept,
  onReject,
}: InvitationListProps) {
  if (invitations.length === 0) {
    return <p className="invitation-list__empty">{friendsPage.hints.emptyInvitations}</p>;
  }

  return (
    <ul className="invitation-list">
      {invitations.map((invitation) => (
        <li className="invitation-list__item" key={invitation.id}>
          <span className="invitation-list__avatar">
            <Image
              className="invitation-list__avatar-image"
              src={invitation.inviter.avatarUrl ?? FALLBACK}
              alt={`Avatar của ${invitation.inviter.username}`}
              width={40}
              height={40}
              unoptimized
            />
          </span>

          <div className="invitation-list__info">
            <span className="invitation-list__text">
              {friendsPage.inviteFrom(invitation.inviter.username)}
            </span>
            <span className="invitation-list__group">{invitation.group.name}</span>
          </div>

          <div className="invitation-list__actions">
            <button
              className="invitation-list__accept"
              type="button"
              disabled={pendingId === invitation.id}
              onClick={() => onAccept(invitation)}
            >
              {pendingId === invitation.id
                ? friendsPage.loading
                : friendsPage.buttons.accept}
            </button>
            <button
              className="invitation-list__reject"
              type="button"
              disabled={pendingId === invitation.id}
              onClick={() => onReject(invitation)}
            >
              {friendsPage.buttons.reject}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export { InvitationList };
export type { InvitationListProps };
