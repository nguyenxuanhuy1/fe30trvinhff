"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Skeleton } from "antd";
import Image from "next/image";
import Link from "next/link";
import { getLessons, getRoom } from "@/modules/lessons";
import { useInventory, useItemPreload } from "@/modules/inventory";
import { enterFullscreenAndLockLandscape } from "@/utils";
import { ExitFullscreenButton } from "@/components/ExitFullscreenButton";
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
    staleTime: 30_000,
  });

  const lessonsQuery = useQuery({
    queryKey: ["room-lessons", roomId],
    queryFn: () => getLessons(roomId),
    staleTime: 30_000,
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
      <div
        className="landscape-prompt"
        onClick={() => void enterFullscreenAndLockLandscape()}
        style={{ cursor: "pointer" }}
      >
        <p>Vui lòng xoay ngang màn hình để trải nghiệm tốt nhất</p>
        <span style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: 8 }}>
          (Chạm vào màn hình để tự động xoay ngang)
        </span>
      </div>

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

      <ExitFullscreenButton />

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

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : roomQuery.isError || lessonsQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message="Không thể tải danh sách bài học của cấp độ này."
            action={
              <Button
                size="small"
                onClick={() => {
                  void roomQuery.refetch();
                  void lessonsQuery.refetch();
                }}
              >
                Thử lại
              </Button>
            }
          />
        ) : filteredLessons.length === 0 ? (
          <div className="level-lessons__empty empty-board">
            <div className="empty-board__icon-wrap">
              <span className="empty-board__icon">
                {activeTab === "favorites"
                  ? "❤️"
                  : activeTab === "new"
                    ? "✨"
                    : "📜"}
              </span>
            </div>
            <h3 className="empty-board__title">
              {activeTab === "favorites"
                ? "Chưa có bài yêu thích"
                : activeTab === "new"
                  ? "Chưa có bài học mới"
                  : "Chưa có bài học"}
            </h3>
            <p className="empty-board__desc">
              {activeTab === "favorites"
                ? "Bấm vào biểu tượng trái tim trên các bài học để lưu lại danh sách yêu thích của bạn."
                : activeTab === "new"
                  ? "Hiện tại không có bài học nào được đăng tải trong vòng 1 tuần qua."
                  : "Cấp độ này hiện chưa có bài học nào."}
            </p>
          </div>
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
                  <Link href={targetUrl} className="news-card ui-game-card">
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
