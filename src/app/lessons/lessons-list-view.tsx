"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Skeleton } from "antd";
import Image from "next/image";
import Link from "next/link";
import { getRooms } from "@/modules/lessons";
import { ImageCard } from "@/modules/lessons/components/image-card/ImageCard";
import { useInventory, useItemPreload } from "@/modules/inventory";
import { LessonsBackButton } from "./components/lessons-back-button/lessons-back-button";
import { LessonsTopHud } from "./components/lessons-top-hud/lessons-top-hud";
import { LessonsBottomDock } from "./components/lessons-bottom-dock/lessons-bottom-dock";
import { ExitFullscreenButton } from "@/components/ExitFullscreenButton";
import { enterFullscreenAndLockLandscape } from "@/utils";
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

  return (
    <>
      {/* Overlay nhắc xoay ngang thiết bị (chỉ hiện trên mobile dọc) */}
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
        <ul className="levels-page__grid">
          {rooms.map((room, index) => {
            const levelNum = String(index + 1).padStart(2, "0");
            const lessonCount = room._count?.lessons ?? 0;

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
    </>
  );
}

export { LessonsListView };
