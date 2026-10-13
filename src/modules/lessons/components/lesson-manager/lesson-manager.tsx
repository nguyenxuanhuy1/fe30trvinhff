"use client";

import { useState } from "react";
import type { Lesson, LessonPayload } from "@/modules/lessons";
import { lessonManagerContent } from "./lesson-manager.const";
import "./lesson-manager.scss";

interface LessonManagerProps {
  // null nghĩa là đang tạo bài học mới, còn có lesson là đang sửa
  lesson: Lesson | null;
  // Nội dung html hiện tại khi sửa, để trống thì giữ nguyên html đang có
  htmlValue: string;
  onSubmit: (payload: LessonPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
  errorMessage: string | null;
}

function LessonManager({
  lesson,
  htmlValue,
  onSubmit,
  onCancel,
  isSaving,
  errorMessage,
}: LessonManagerProps) {
  const [name, setName] = useState(lesson?.name ?? "");
  const [imageUrl, setImageUrl] = useState(lesson?.imageUrl ?? "");
  const [html, setHtml] = useState(htmlValue);
  const [order, setOrder] = useState(lesson ? String(lesson.order) : "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2) return;

    const payload: LessonPayload = { name: trimmedName, imageUrl: imageUrl.trim() };
    if (html.trim() !== "") {
      payload.html = html;
    }
    const trimmedOrder = order.trim();
    if (trimmedOrder !== "") {
      payload.order = Number(trimmedOrder);
    }

    onSubmit(payload);
  }

  return (
    <form className="lesson-manager" onSubmit={handleSubmit}>
      <h3 className="lesson-manager__title">
        {lesson === null ? lessonManagerContent.createTitle : lessonManagerContent.editTitle}
      </h3>

      <label className="lesson-manager__field">
        <span className="lesson-manager__label">{lessonManagerContent.labels.name}</span>
        <input
          className="lesson-manager__input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={lessonManagerContent.hints.namePlaceholder}
          maxLength={150}
          required
        />
      </label>

      <label className="lesson-manager__field">
        <span className="lesson-manager__label">{lessonManagerContent.labels.image}</span>
        <input
          className="lesson-manager__input"
          type="text"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder={lessonManagerContent.hints.imagePlaceholder}
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

      <label className="lesson-manager__field">
        <span className="lesson-manager__label">{lessonManagerContent.labels.html}</span>
        <textarea
          className="lesson-manager__textarea"
          value={html}
          onChange={(event) => setHtml(event.target.value)}
          placeholder={lessonManagerContent.hints.htmlPlaceholder}
          rows={8}
          maxLength={200000}
        />
        <span className="lesson-manager__note">{lessonManagerContent.keepHtmlNote}</span>
      </label>

      <label className="lesson-manager__field">
        <span className="lesson-manager__label">{lessonManagerContent.labels.order}</span>
        <input
          className="lesson-manager__input"
          type="number"
          min={0}
          step={1}
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          placeholder={lessonManagerContent.hints.orderPlaceholder}
        />
      </label>

      {errorMessage !== null && <p className="lesson-manager__error">{errorMessage}</p>}

      <div className="lesson-manager__actions">
        <button
          className="lesson-manager__button lesson-manager__button--primary"
          type="submit"
          disabled={isSaving || name.trim().length < 2}
        >
          {isSaving ? lessonManagerContent.saving : lessonManagerContent.buttons.save}
        </button>
        {lesson !== null && (
          <button
            className="lesson-manager__button"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
          >
            {lessonManagerContent.buttons.cancel}
          </button>
        )}
      </div>
    </form>
  );
}

export { LessonManager };
export type { LessonManagerProps };
