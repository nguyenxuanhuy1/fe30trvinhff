"use client";

import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useEffect, useState } from "react";
import { getLessons } from "@/modules/lessons";
import type { Lesson, Room } from "@/modules/lessons";
import { lessonsPage } from "../rooms.const";
import "./lessons.scss";

interface LessonsViewProps {
  room: Room;
}

function LessonsView({ room }: LessonsViewProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Bọc async để setState chỉ chạy trong callback, tránh setState đồng bộ trong effect
    async function loadLessons() {
      try {
        setLessons(await getLessons(room.id));
      } catch (error) {
        setLoadError(getErrorMessage(error, lessonsPage.loadFailed));
      } finally {
        setIsLoading(false);
      }
    }

    void loadLessons();
  }, [room.id]);

  if (isLoading) {
    return (
      <section className="lessons">
        <p className="lessons__loading">{lessonsPage.loading}</p>
      </section>
    );
  }

  return (
    <section className="lessons">
      <header className="lessons__header">
        <h1 className="lessons__title">{room.name}</h1>
        <Link className="lessons__back" href="/phong">
          {lessonsPage.backLabel}
        </Link>
      </header>

      <div className="lessons__section">
        {loadError !== null ? (
          <p className="lessons__empty">{loadError}</p>
        ) : lessons.length === 0 ? (
          <p className="lessons__empty">{lessonsPage.hints.empty}</p>
        ) : (
          <ul className="lessons__grid">
            {lessons.map((lesson) => {
              const target = lesson.slug
                ? `/lab/${lesson.slug}`
                : lesson.path
                  ? `/lab/${lesson.slug || "demo"}`
                  : `/phong/${room.id}/${lesson.id}`;

              return (
                <li className="lessons__item" key={lesson.id}>
                  <Link className="lessons__link" href={target}>
                  <span className="lessons__media">
                    {lesson.imageUrl ? (
                      <Image
                        className="lessons__image"
                        src={lesson.imageUrl}
                        alt={lesson.name}
                        width={640}
                        height={360}
                        sizes="320px"
                        unoptimized
                      />
                    ) : (
                      <span className="lessons__placeholder">{lessonsPage.hints.noImage}</span>
                    )}
                  </span>
                  <span className="lessons__name">{lesson.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        )}
      </div>
    </section>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

export { LessonsView };
export type { LessonsViewProps };
