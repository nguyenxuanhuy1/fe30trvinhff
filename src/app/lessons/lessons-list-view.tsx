"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Skeleton } from "antd";
import Link from "next/link";
import { getRooms } from "@/modules/lessons";
import { ImageCard } from "@/modules/lessons/components/image-card/ImageCard";
import { useInventory, useItemPreload } from "@/modules/inventory";
import { LessonsBackButton } from "./components/lessons-back-button/lessons-back-button";
import { LessonsTopHud } from "./components/lessons-top-hud/lessons-top-hud";
import { LessonsBottomDock } from "./components/lessons-bottom-dock/lessons-bottom-dock";
import { ExitFullscreenButton } from "@/components/ExitFullscreenButton";
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
    staleTime: 30_000,
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
      <LessonsBackButton href="/?landing=true" />
      <LessonsTopHud />
      <LessonsBottomDock />
      <ExitFullscreenButton />

      {roomsQuery.isLoading ? (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : roomsQuery.isError ? (
        <Alert
          type="error"
          showIcon
          message="Không thể tải danh sách cấp độ học."
          action={
            <Button size="small" onClick={() => void roomsQuery.refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : rooms.length === 0 ? (
        <div className="levels-page__empty">
          <p>Chưa có cấp độ nào được tạo.</p>
          <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Quản trị viên có thể vào trang Quản trị (Admin) để thêm các mục Cấp 1, Cấp 2, Cấp 3...
          </p>
          <Link href="/admin">
            <Button type="primary" style={{ marginTop: 12 }}>
              Đi tới trang Quản trị
            </Button>
          </Link>
        </div>
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
