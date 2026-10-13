"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, Button } from "antd";
import { toast } from "@/components/ui/game-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/modules/auth";
import { listLessons, slotLabels } from "@/modules/inventory";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  LevelIcon,
  LockIcon,
  StarIcon,
} from "./level-icons";
import { DEFAULT_PLAY_LEVELS, levelSelectorTexts } from "./level-selector.const";
import type { LevelSelectorProps, PlayLevel } from "./level-selector.types";
import "./level-selector.scss";

export function LevelSelector({
  onEnterLab,
  className = "",
  initialSelectedId,
  compact = false,
}: LevelSelectorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "unlocked">("all");

  const lessonsQuery = useQuery({
    queryKey: ["lab-lessons"],
    queryFn: listLessons,
    staleTime: 60_000,
  });

  // Gộp danh sách bài từ backend với các cấp độ trò chơi
  const levels = useMemo<PlayLevel[]>(() => {
    const backendLessons = lessonsQuery.data ?? [];
    if (backendLessons.length === 0) {
      return DEFAULT_PLAY_LEVELS;
    }

    // Ghép dữ liệu bài học thực tế từ API vào các cấp độ tương ứng
    return DEFAULT_PLAY_LEVELS.map((defLevel) => {
      const matched = backendLessons.find(
        (l) =>
          l.id === defLevel.id ||
          (l.slug && l.slug === defLevel.slug) ||
          l.order === defLevel.levelNumber,
      );

      if (!matched) return defLevel;

      const slug = matched.slug ?? defLevel.slug ?? "demo";
      const targetPath = matched.isPlugin
        ? `/lab/${slug}`
        : matched.roomId
          ? `/lessons/${matched.roomId}/${matched.id}`
          : `/lab/${slug}`;

      return {
        ...defLevel,
        title: defLevel.title.includes(":")
          ? `${defLevel.title.split(":")[0]}: ${matched.name}`
          : matched.name,
        targetPath,
        slug: matched.slug ?? defLevel.slug,
        isPlugin: matched.isPlugin,
        suggestedSlots: matched.requiredSlots?.length
          ? matched.requiredSlots
          : defLevel.suggestedSlots,
        roomId: matched.roomId ?? defLevel.roomId,
      };
    });
  }, [lessonsQuery.data]);

  const filteredLevels = useMemo(() => {
    if (filter === "unlocked") {
      return levels.filter((l) => !l.isLocked);
    }
    return levels;
  }, [levels, filter]);

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialSelectedId && levels.some((l) => l.id === initialSelectedId)) {
      return initialSelectedId;
    }
    const firstUnlocked = levels.find((l) => !l.isLocked);
    return firstUnlocked?.id ?? levels[0].id;
  });

  const selectedLevel = useMemo(() => {
    return levels.find((l) => l.id === selectedId) ?? levels[0];
  }, [levels, selectedId]);

  const handleSelectCell = (level: PlayLevel) => {
    if (level.isLocked) {
      toast.warning(
        level.lockReason || levelSelectorTexts.lockedNotice,
      );
      return;
    }
    setSelectedId(level.id);
  };

  const handleEnterLabClick = () => {
    if (!selectedLevel) return;

    if (onEnterLab) {
      onEnterLab(selectedLevel);
      return;
    }

    // Nếu chưa đăng nhập, chuyển tới trang đăng nhập để lưu tiến trình
    if (!user) {
      const nextUrl = encodeURIComponent(selectedLevel.targetPath);
      router.push(`/login?next=${nextUrl}`);
      return;
    }

    router.push(selectedLevel.targetPath);
  };

  return (
    <div
      className={`level-selector ${
        compact ? "level-selector--compact" : ""
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="level-selector__header">
        <div className="level-selector__title-box">
          <span className="level-selector__tag-badge">
            <span style={{ fontSize: "1rem" }}>🧪</span>
            Phòng Nghiên Cứu &amp; Thực Hành
          </span>
          <h2 className="level-selector__heading">
            {levelSelectorTexts.headerTitle}
          </h2>
          <p className="level-selector__subheading">
            {levelSelectorTexts.headerSubtitle}
          </p>
        </div>

        <div className="level-selector__filter-pills">
          <button
            type="button"
            className={`level-selector__filter-pill ${
              filter === "all" ? "level-selector__filter-pill--active" : ""
            }`}
            onClick={() => setFilter("all")}
          >
            {levelSelectorTexts.allFilter} ({levels.length})
          </button>
          <button
            type="button"
            className={`level-selector__filter-pill ${
              filter === "unlocked"
                ? "level-selector__filter-pill--active"
                : ""
            }`}
            onClick={() => setFilter("unlocked")}
          >
            {levelSelectorTexts.unlockedFilter} (
            {levels.filter((l) => !l.isLocked).length})
          </button>
        </div>
      </div>

      {/* Grid of Level Cells ("các ô cấp độ chơi") */}
      <ul
        className="level-selector__grid"
        role="radiogroup"
        aria-label="Danh sách các ô cấp độ chơi"
      >
        {filteredLevels.map((lvl) => {
          const isSelected = lvl.id === selectedId;
          const isLocked = lvl.isLocked;

          return (
            <li
              key={lvl.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isLocked ? -1 : 0}
              className={[
                "level-selector__cell",
                isSelected ? "level-selector__cell--selected" : "",
                isLocked ? "level-selector__cell--locked" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSelectCell(lvl)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelectCell(lvl);
                }
              }}
            >
              {/* Cell Top: Level index and status */}
              <div className="level-selector__cell-top">
                <span className="level-selector__cell-number">
                  Cấp độ {String(lvl.levelNumber).padStart(2, "0")}
                </span>
                <span
                  className={`level-selector__cell-status-pill ${
                    isLocked
                      ? "level-selector__cell-status-pill--locked"
                      : "level-selector__cell-status-pill--ready"
                  }`}
                >
                  {isLocked ? (
                    <>
                      <LockIcon style={{ width: 12, height: 12 }} />
                      {levelSelectorTexts.lockedBadge}
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon style={{ width: 12, height: 12 }} />
                      {levelSelectorTexts.readyBadge}
                    </>
                  )}
                </span>
              </div>

              {/* Cell Body: Icon, Title, Subtitle */}
              <div className="level-selector__cell-body">
                <div className="level-selector__cell-icon-wrap">
                  <LevelIcon
                    type={lvl.iconType}
                    className="level-selector__cell-icon"
                  />
                </div>
                <div className="level-selector__cell-info">
                  <h3 className="level-selector__cell-title" title={lvl.title}>
                    {lvl.title.replace(/^Cấp độ \d+:\s*/, "")}
                  </h3>
                  <p className="level-selector__cell-subtitle">
                    {lvl.subtitle}
                  </p>
                </div>
              </div>

              {/* Cell Bottom: Stars and difficulty label */}
              <div className="level-selector__cell-bottom">
                <div className="level-selector__cell-stars" title={`Độ khó: ${lvl.difficulty}/5`}>
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <StarIcon
                      key={starIdx}
                      filled={starIdx <= lvl.difficulty}
                      className={`star-icon ${
                        starIdx > lvl.difficulty ? "star-icon--empty" : ""
                      }`}
                    />
                  ))}
                </div>
                <span className="level-selector__cell-difficulty-tag">
                  {lvl.difficultyLabel}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Selected Level Inspector Panel (Bảng xem chi tiết & nút Vào phòng thí nghiệm) */}
      {selectedLevel && (
        <div className="level-selector__inspector" aria-live="polite">
          <div className="level-selector__inspector-content">
            <div className="level-selector__inspector-badge-row">
              <span className="level-selector__inspector-level-badge">
                CẤP ĐỘ {selectedLevel.levelNumber}
              </span>
              <span className="level-selector__cell-difficulty-tag">
                {selectedLevel.difficultyLabel} (★ {selectedLevel.difficulty}/5)
              </span>
            </div>

            <h3 className="level-selector__inspector-title">
              {selectedLevel.title}
            </h3>

            <p className="level-selector__inspector-desc">
              {selectedLevel.description}
            </p>

            <div className="level-selector__inspector-meta">
              {/* Phần thưởng */}
              {selectedLevel.rewards.length > 0 && (
                <div className="level-selector__meta-item">
                  <strong>{levelSelectorTexts.rewardsLabel}:</strong>
                  <div className="level-selector__reward-chips">
                    {selectedLevel.rewards.map((r, i) => (
                      <span key={i} className="level-selector__reward-chip">
                        🎁 {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gợi ý đồ bảo hộ */}
              <div className="level-selector__meta-item">
                <strong>{levelSelectorTexts.requiredGearLabel}:</strong>
                <div className="level-selector__reward-chips">
                  {selectedLevel.suggestedSlots.length > 0 ? (
                    selectedLevel.suggestedSlots.map((slot) => (
                      <span key={slot} className="level-selector__reward-chip">
                        🥼 {slotLabels[slot] ?? slot}
                      </span>
                    ))
                  ) : (
                    <span>{levelSelectorTexts.noGearRequired}</span>
                  )}
                </div>
              </div>
            </div>

            {!user && (
              <div className="level-selector__login-alert">
                <Alert
                  type="info"
                  showIcon
                  message={levelSelectorTexts.loginToPlayNotice}
                  action={
                    <Link
                      href={`/login?next=${encodeURIComponent(
                        selectedLevel.targetPath,
                      )}`}
                    >
                      <Button size="small" type="primary">
                        {levelSelectorTexts.loginCta}
                      </Button>
                    </Link>
                  }
                />
              </div>
            )}
          </div>

          <div className="level-selector__inspector-actions">
            <button
              type="button"
              className="level-selector__enter-button"
              onClick={handleEnterLabClick}
              disabled={selectedLevel.isLocked}
            >
              <span>{levelSelectorTexts.enterLabButton}</span>
              <ChevronRightIcon className="enter-icon" />
            </button>
            <p className="level-selector__enter-hint">
              {levelSelectorTexts.enterLabHint}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
