"use client";

import Image from "next/image";
import { useState } from "react";
import type { FriendCandidate } from "@/modules/friends/types";
import { friendsPage } from "../friends.const";
import "./friend-search.scss";

const FALLBACK = "/images/chuotuser.png";

interface FriendSearchProps {
  candidates: FriendCandidate[];
  hasSearched: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onSearch: (keyword: string) => void;
  onInvite: (candidate: FriendCandidate) => void;
  pendingId: string | null;
}

function FriendSearch({
  candidates,
  hasSearched,
  isLoading,
  errorMessage,
  onSearch,
  onInvite,
  pendingId,
}: FriendSearchProps) {
  const [keyword, setKeyword] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = keyword.trim();
    if (term.length === 0) return;
    onSearch(term);
  }

  return (
    <div className="friend-search">
      <form className="friend-search__form" onSubmit={handleSubmit}>
        <input
          className="friend-search__input"
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={friendsPage.hints.searchPlaceholder}
          maxLength={50}
        />
        <button className="friend-search__button" type="submit" disabled={isLoading}>
          {friendsPage.buttons.search}
        </button>
      </form>

      {errorMessage !== null && <p className="friend-search__error">{errorMessage}</p>}
      {isLoading && <p className="friend-search__loading">{friendsPage.loading}</p>}

      {!isLoading && !hasSearched && (
        <p className="friend-search__empty">{friendsPage.hints.searchPrompt}</p>
      )}

      {!isLoading && hasSearched && candidates.length === 0 && (
        <p className="friend-search__empty">{friendsPage.hints.emptySearch}</p>
      )}

      {candidates.length > 0 && (
        <ul className="friend-search__list">
          {candidates.map((candidate) => (
            <li className="friend-search__item" key={candidate.id}>
              <span className="friend-search__avatar">
                <Image
                  className="friend-search__avatar-image"
                  src={candidate.avatarUrl ?? FALLBACK}
                  alt={`Avatar của ${candidate.username}`}
                  width={40}
                  height={40}
                  unoptimized
                />
              </span>

              <div className="friend-search__info">
                <span className="friend-search__name">{candidate.username}</span>
                {candidate.hasGroup && candidate.groupName !== null && (
                  <span className="friend-search__badge friend-search__badge--warn">
                    {friendsPage.badges.hasGroup}: {candidate.groupName}
                  </span>
                )}
                {candidate.isMyGroupMember && (
                  <span className="friend-search__badge">
                    {friendsPage.badges.inGroup}
                  </span>
                )}
                {candidate.isInvitedByMe && (
                  <span className="friend-search__badge">
                    {friendsPage.badges.invited}
                  </span>
                )}
              </div>

              <button
                className="friend-search__invite"
                type="button"
                disabled={
                  candidate.hasGroup ||
                  candidate.isMyGroupMember ||
                  candidate.isInvitedByMe ||
                  pendingId === candidate.id
                }
                onClick={() => onInvite(candidate)}
                title={
                  candidate.hasGroup
                    ? `${candidate.username} đã có nhóm rồi`
                    : undefined
                }
              >
                {candidate.hasGroup
                  ? friendsPage.badges.hasGroup
                  : pendingId === candidate.id
                    ? friendsPage.loading
                    : friendsPage.buttons.invite}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { FriendSearch };
export type { FriendSearchProps };
