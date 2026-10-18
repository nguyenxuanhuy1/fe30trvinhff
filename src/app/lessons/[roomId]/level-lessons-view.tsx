"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { getLessons, getRoom, preloadAndCacheGame } from "@/modules/lessons";
import { useInventory, useItemPreload } from "@/modules/inventory";
import { EmptyState, ErrorState, GameCardSkeleton } from "@/components/ui";
import "./level-lessons.scss";

interface LevelLessonsViewProps {
  roomId: string;
}

export function LevelLessonsView({ roomId }: LevelLessonsViewProps) {
  const [mounted, setMounted] = useState(false);
  const [likesState, setLikesState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("project30tr_lesson_likes");
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated: Record<string, boolean> = {};
        for (const key in parsed) {
          if (typeof parsed[key] === "object" && "isLiked" in parsed[key]) {
            migrated[key] = parsed[key].isLiked;
          } else {
            migrated[key] = !!parsed[key];
          }
        }
        setLikesState(migrated);
      }
    } catch {
      // Ignore
    }
  }, []);

  const isLessonLiked = (lessonId: string): boolean => {
    return !!likesState[lessonId];
  };

  const handleToggleLike = (e: React.MouseEvent, lessonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setLikesState((prev) => {
      const isLiked = !prev[lessonId];
      const updated = {
        ...prev,
        [lessonId]: isLiked,
      };
      try {
        localStorage.setItem("project30tr_lesson_likes", JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const inventoryQuery = useInventory();
  useItemPreload(inventoryQuery.inventory?.equipped ?? []);

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId),
  });

  const lessonsQuery = useQuery({
    queryKey: ["room-lessons", roomId],
    queryFn: () => getLessons(roomId),
  });

  const room = roomQuery.data;
  const lessons = lessonsQuery.data ?? [];
  const isLoading = roomQuery.isLoading || lessonsQuery.isLoading;

  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "new">("all");

  const filteredLessons = lessons.filter((lesson) => {
    if (activeTab === "all") return true;
    if (activeTab === "favorites") {
      return isLessonLiked(lesson.id);
    }
    if (activeTab === "new") {
      return !!lesson.isNew;
    }
    return true;
  });

  return (
    <>

      {mounted && typeof document !== "undefined" ? (
        createPortal(
          <Link className="close-btn" href="/lessons" aria-label="Đóng">
            <span className="close-btn__icon">×</span>
          </Link>,
          document.body
        )
      ) : (
        <Link className="close-btn" href="/lessons" aria-label="Đóng">
          <span className="close-btn__icon">×</span>
        </Link>
      )}

      <div className="level-lessons">
        <div className="tab-bar" style={{ marginBottom: "2rem" }}>
          <div
            className={`tab ${activeTab === "all" ? "is-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <span className="tab__label">Tất cả</span>
          </div>
          <div
            className={`tab ${activeTab === "favorites" ? "is-active" : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            <span className="tab__label">Yêu thích</span>
          </div>
          <div
            className={`tab ${activeTab === "new" ? "is-active" : ""}`}
            onClick={() => setActiveTab("new")}
          >
            <span className="tab__label">Mới</span>
          </div>
        </div>

        {(lessonsQuery.isLoading || roomQuery.isLoading) && lessons.length === 0 ? (
          <ul className="level-lessons__grid">
            <GameCardSkeleton count={6} variant="lesson" />
          </ul>
        ) : roomQuery.isError || lessonsQuery.isError ? (
          <ErrorState
            error={roomQuery.error || lessonsQuery.error}
            message="Không thể tải danh sách bài học của cấp độ này."
            onRetry={() => {
              void roomQuery.refetch();
              void lessonsQuery.refetch();
            }}
          />
        ) : filteredLessons.length === 0 ? (
          <EmptyState
            icon={activeTab === "favorites" ? "❤️" : activeTab === "new" ? "✨" : "📜"}
            title={
              activeTab === "favorites"
                ? "Chưa có bài yêu thích"
                : activeTab === "new"
                  ? "Chưa có bài học mới"
                  : "Chưa có bài học"
            }
            description={
              activeTab === "favorites"
                ? "Bấm vào biểu tượng trái tim trên các bài học để lưu lại danh sách yêu thích của bạn."
                : activeTab === "new"
                  ? "Hiện tại không có bài học nào được đăng tải trong vòng 1 tuần qua."
                  : "Cấp độ này hiện chưa có bài học nào."
            }
            actionText={activeTab !== "all" ? "Xem tất cả bài học" : undefined}
            onAction={activeTab !== "all" ? () => setActiveTab("all") : undefined}
          />
        ) : (
          <ul className="level-lessons__grid">
            {filteredLessons.map((lesson, index) => {
              const targetUrl = lesson.slug
                ? `/lab/${lesson.slug}`
                : lesson.path
                  ? `/lab/${lesson.slug || "demo"}`
                  : `/lessons/${roomId}/${lesson.id}`;

              const isLiked = isLessonLiked(lesson.id);

              return (
                <li key={lesson.id} className="level-lessons__item">
                  <Link
                    href={targetUrl}
                    className="news-card ui-game-card"
                    onMouseEnter={() => void preloadAndCacheGame(lesson.id)}
                    onTouchStart={() => void preloadAndCacheGame(lesson.id)}
                    onClick={() => void preloadAndCacheGame(lesson.id)}
                  >
                    <div className="news-card__thumb">
                      {lesson.imageUrl ? (
                        <Image
                          src={lesson.imageUrl}
                          alt={lesson.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
                          priority={index < 3}
                          className="news-card__image"
                          unoptimized={lesson.imageUrl.startsWith("data:")}
                        />
                      ) : (
                        <div className="news-card__placeholder">
                          <span className="news-card__placeholder-icon">📖</span>
                          <span className="news-card__placeholder-text">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>
                    <div className="news-card__body">
                      {lesson.isNew && (
                        <span className="news-card__tag">{lesson.tag || "MỚI"}</span>
                      )}
                      <h3 className="news-card__title" title={lesson.name}>{lesson.name}</h3>

                      <div className="news-card__footer">
                        <button
                          type="button"
                          className={`news-card__heart-btn ${isLiked ? "news-card__heart-btn--active" : ""}`}
                          onClick={(e) => handleToggleLike(e, lesson.id)}
                          title={isLiked ? "Bỏ thích" : "Thích bài học"}
                          aria-label="Thích bài học"
                        >
                          <svg
                            className="news-card__heart-icon"
                            viewBox="0 0 24 24"
                            fill={isLiked ? "#ff2b42" : "rgba(255, 255, 255, 0.4)"}
                            stroke={isLiked ? "#c41026" : "#2a2523"}
                            strokeWidth="2"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
