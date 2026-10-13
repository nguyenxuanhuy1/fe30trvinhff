"use client";

import { useState } from "react";
import { friendsPage } from "../friends.const";
import "./group-create.scss";

interface GroupCreateProps {
  onCreate: (name: string) => void;
  isCreating: boolean;
  errorMessage: string | null;
}

function GroupCreate({ onCreate, isCreating, errorMessage }: GroupCreateProps) {
  const [name, setName] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = name.trim();
    if (value.length < 2) return;
    onCreate(value);
  }

  return (
    <form className="group-create" onSubmit={handleSubmit}>
      <p className="group-create__hint">{friendsPage.hints.noGroup}</p>
      <div className="group-create__form">
        <input
          className="group-create__input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={friendsPage.hints.namePlaceholder}
          maxLength={100}
        />
        <button
          className="group-create__button"
          type="submit"
          disabled={isCreating || name.trim().length < 2}
        >
          {isCreating ? friendsPage.loading : friendsPage.buttons.create}
        </button>
      </div>
      {errorMessage !== null && <p className="group-create__error">{errorMessage}</p>}
    </form>
  );
}

export { GroupCreate };
export type { GroupCreateProps };
