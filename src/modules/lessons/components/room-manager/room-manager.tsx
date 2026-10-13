"use client";

import { useState } from "react";
import type { Room, RoomPayload } from "@/modules/lessons";
import { roomManagerContent } from "./room-manager.const";
import "./room-manager.scss";

interface RoomManagerProps {
  // null nghĩa là đang tạo phòng mới, còn có room là đang sửa
  room: Room | null;
  onSubmit: (payload: RoomPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
  errorMessage: string | null;
}

function RoomManager({ room, onSubmit, onCancel, isSaving, errorMessage }: RoomManagerProps) {

  const [imageUrl, setImageUrl] = useState(room?.imageUrl ?? "");


  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: RoomPayload = { name: room?.name || "Cấp độ", imageUrl: imageUrl.trim() };


    onSubmit(payload);
  }

  return (
    <form className="room-manager" onSubmit={handleSubmit}>
      <h3 className="room-manager__title">
        {room === null ? roomManagerContent.createTitle : roomManagerContent.editTitle}
      </h3>

      {/* Đã bỏ trường Tên phòng theo yêu cầu */}

      <label className="room-manager__field">
        <span className="room-manager__label">{roomManagerContent.labels.image}</span>
        <input
          className="room-manager__input"
          type="text"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder={roomManagerContent.hints.imagePlaceholder}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                if (e.target?.result) {
                  setImageUrl(e.target.result as string);
                }
              };
              reader.readAsDataURL(file);
            }
          }}
          style={{ marginTop: 8 }}
        />
      </label>

      {/* Đã bỏ trường Thứ tự hiển thị theo yêu cầu */}

      {errorMessage !== null && <p className="room-manager__error">{errorMessage}</p>}

      <div className="room-manager__actions">
        <button
          className="room-manager__button room-manager__button--primary"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? roomManagerContent.saving : roomManagerContent.buttons.save}
        </button>
        {room !== null && (
          <button
            className="room-manager__button"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            {roomManagerContent.buttons.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

export { RoomManager };
export type { RoomManagerProps };
