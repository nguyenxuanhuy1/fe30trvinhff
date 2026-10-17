"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getRooms } from "@/modules/lessons";
import { ImageCard } from "@/modules/lessons/components/image-card/ImageCard";
import { useInventory, useItemPreload } from "@/modules/inventory";
import { EmptyState, ErrorState, GameButton, GameCardSkeleton } from "@/components/ui";
import { LessonsBackButton } from "./components/lessons-back-button/lessons-back-button";
import { LessonsTopHud } from "./components/lessons-top-hud/lessons-top-hud";
import { LessonsBottomDock } from "./components/lessons-bottom-dock/lessons-bottom-dock";
import "./lessons-list-view.scss";

/**
 * Trang Lựa chọn Cấp độ học.
 * Hiển thị các cấp độ (Cấp 1, Cấp 2, Cấp 3...) do người dùng / admin thêm vào.
 * Khi bấm vào một cấp độ, chuyển router tới trang các bài học của cấp độ đó.
 */
function LessonsListView() {
  const inventoryQuery = useInventory();
  useItemPreload(inventoryQuery.inventory?.equipped ?? []);

  const roomsQuery = useQuery({
    queryKey: ["levels-rooms"],
    queryFn: getRooms,
  });

  const rooms = roomsQuery.data ?? [];

  // Hỗ trợ kéo chuột trái/phải trên desktop khi ở giao diện dạng thẻ trượt
  const gridRef = useRef<HTMLUListElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLUListElement>) => {
    const el = gridRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLUListElement>) => {
    if (!isDraggingRef.current) return;
    const el = gridRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="levels-page">
      <LessonsBackButton href="/" />
      <LessonsTopHud />
      <LessonsBottomDock />

      {roomsQuery.isLoading && rooms.length === 0 ? (
        <ul className="levels-page__grid">
          <GameCardSkeleton count={4} variant="image-card" />
        </ul>
      ) : roomsQuery.isError ? (
        <ErrorState
          error={roomsQuery.error}
          message="Không thể tải danh sách cấp độ học."
          onRetry={() => void roomsQuery.refetch()}
        />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Chưa có cấp độ nào"
          description="Hiện tại hệ thống chưa có cấp độ học nào được tạo. Quản trị viên có thể vào trang Quản trị để thêm các cấp độ mới."
          actionText="Đi tới trang Quản trị"
          actionHref="/admin"
        />
      ) : (
        <ul
          ref={gridRef}
          className="levels-page__grid"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          {rooms.map((room, index) => {
            return (
              <ImageCard
                key={room.id}
                href={`/lessons/${room.id}`}
                imageUrl={room.imageUrl}
                altText={room.name}
                priority={index < 3}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

export { LessonsListView };
