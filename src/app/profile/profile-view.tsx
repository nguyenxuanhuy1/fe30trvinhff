"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User, UserGroupInfo } from "@/modules/auth/types";
import { getMyOrders, type ShopOrder } from "@/modules/shop";
import { getMyGroup } from "@/modules/friends";
import { useAuth } from "@/modules/auth";
import { getInventory, useCatalog, type Inventory } from "@/modules/inventory";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { CoinIcon } from "@/components/ui/coin-icon";
import { AvatarEditor } from "./avatar-editor/avatar-editor";
import {
  InboxOutlined,
  ShoppingOutlined,
  SkinOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

interface ProfileViewProps {
  initialUser?: User | null;
  user?: User;
}

type ProfileTab = "inventory" | "orders" | "info";

export function ProfileView({ initialUser, user: propUser }: ProfileViewProps) {
  const { user: authUser } = useAuth();
  const user = propUser ?? initialUser ?? authUser;

  const [activeTab, setActiveTab] = useState<ProfileTab>("inventory");

  const catalogQuery = useCatalog();

  const inventoryQuery = useQuery({
    queryKey: ["inventory", user?.id],
    queryFn: getInventory,
    enabled: !!user,
  });
  const inventory = inventoryQuery.data ?? null;
  const isLoadingInventory = inventoryQuery.isLoading;

  const ordersQuery = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: getMyOrders,
    enabled: !!user,
  });
  const orders = ordersQuery.data ?? [];
  const isLoadingOrders = ordersQuery.isLoading;

  const groupQuery = useQuery({
    queryKey: ["my-group", user?.id],
    queryFn: async () => {
      const myGroup = await getMyGroup();
      if (!myGroup || !user) return null;
      return {
        id: myGroup.id,
        name: myGroup.name,
        role: myGroup.ownerId === user.id ? "OWNER" : "MEMBER",
        isOwner: myGroup.ownerId === user.id,
      } as UserGroupInfo;
    },
    enabled: !!user,
    initialData: user?.group ?? null,
  });
  const group = groupQuery.data ?? null;

  // Sản phẩm đặc biệt -> Trạng thái đơn hàng
  const specialOrders = orders.filter((ord) => ord.isSpecial);

  // Danh sách trang bị người dùng đã mua trong DB (bảng userItem)
  const catalogItems = catalogQuery.data ?? [];
  const ownedSet = new Set(inventory?.owned ?? []);
  const equippedSet = new Set(inventory?.equipped ?? []);

  const myOwnedEquipments = catalogItems.filter((it) => ownedSet.has(it.id));

  if (!user) {
    return <LoadingState />;
  }

  if (inventoryQuery.isError || ordersQuery.isError) {
    return (
      <ErrorState
        error={inventoryQuery.error || ordersQuery.error}
        onRetry={() => {
          inventoryQuery.refetch();
          ordersQuery.refetch();
          groupQuery.refetch();
        }}
      />
    );
  }

  // Format giới tính hiển thị
  const genderDisplay =
    user.gender === "FEMALE"
      ? "Nữ"
      : user.gender === "MALE"
        ? "Nam"
        : user.gender === "OTHER"
          ? "Khác"
          : "Nữ";

  return (
    <div className="profile-page-root">
      {/* 1. HEADER THANH GỖ GAME ĐỒNG BỘ TRANG BẠN BÈ */}
      <header className="profile-header">
        <div className="profile-header__left">
          <Link href="/lessons" className="profile-header__back-btn" aria-label="Quay lại">
            <svg
              className="profile-header__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="profile-header__back-text">Quay lại</span>
          </Link>
        </div>

        <div className="profile-header__right">
          <div className="profile-header__coins-badge" title="Số xu của bạn">
            <CoinIcon className="profile-header__coins-icon" />
            <span className="profile-header__coins-value">
              {(user.coins ?? 0).toLocaleString("vi-VN")} Xu
            </span>
          </div>
        </div>
      </header>

      {/* 2. KHU VỰC NỘI DUNG CHÍNH (KHUNG GỖ PARCHMENT GAME) */}
      <main className="profile-content-container">
        <div className="profile-board">
          {/* A. THÔNG TIN NGƯỜI DÙNG: AVATAR CÓ ICON EDIT ANTD + TÊN + GIỚI TÍNH NỮ (KHÔNG ROLE) */}
          <section className="profile-identity">
            <div className="profile-identity__avatar-col">
              <AvatarEditor username={user.username} currentAvatarUrl={user.avatarUrl} />
            </div>

            <div className="profile-identity__info-col">
              <h1 className="profile-identity__username">{user.username}</h1>
              <div className="profile-identity__gender">
                <span className="profile-identity__gender-tag">
                  <span className="profile-identity__gender-icon">
                    {user.gender === "MALE" ? "♂" : "♀"}
                  </span>
                  <span>Giới tính: {genderDisplay}</span>
                </span>

                <span className="profile-identity__group-tag">
                  <span className="profile-identity__group-icon">👥</span>
                  <span>
                    Nhóm:{" "}
                    {group ? (
                      <strong>
                        {group.name} {group.isOwner ? "👑" : ""}
                      </strong>
                    ) : (
                      <em style={{ fontWeight: 600 }}>Chưa vào nhóm</em>
                    )}
                  </span>
                </span>
              </div>
            </div>
          </section>

          {/* B. MENU CHUYỂN GIỮA 3 TRANG: TRANG BỊ, TRẠNG THÁI ĐƠN HÀNG, THÔNG TIN TÀI KHOẢN */}
          <nav className="profile-tabs" aria-label="Menu chức năng cá nhân">
            <button
              type="button"
              className={`profile-tabs__btn ${activeTab === "inventory" ? "profile-tabs__btn--active" : ""}`}
              onClick={() => setActiveTab("inventory")}
              title="Trang bị"
              aria-label="Trang bị"
            >
              <SkinOutlined className="profile-tabs__icon" />
              <span className="profile-tabs__text">Trang bị</span>
            </button>

            <button
              type="button"
              className={`profile-tabs__btn ${activeTab === "orders" ? "profile-tabs__btn--active" : ""}`}
              onClick={() => setActiveTab("orders")}
              title="Trạng thái đơn hàng"
              aria-label="Trạng thái đơn hàng"
            >
              <InboxOutlined className="profile-tabs__icon" />
              <span className="profile-tabs__text">Trạng thái đơn hàng</span>
            </button>

            <button
              type="button"
              className={`profile-tabs__btn ${activeTab === "info" ? "profile-tabs__btn--active" : ""}`}
              onClick={() => setActiveTab("info")}
              title="Thông tin tài khoản"
              aria-label="Thông tin tài khoản"
            >
              <UserOutlined className="profile-tabs__icon" />
              <span className="profile-tabs__text">Thông tin tài khoản</span>
            </button>
          </nav>

          {/* C. NỘI DUNG TỪNG TRANG THEO TAB ĐƯỢC CHỌN */}
          <div className="profile-tab-content">
            {/* ---------------------------------------------------- */}
            {/* TAB 1: TRANG BỊ ĐÃ MUA TRONG DB (USER_ITEMS)         */}
            {/* ---------------------------------------------------- */}
            {activeTab === "inventory" && (
              <div className="profile-inventory-panel">
                {isLoadingInventory || catalogQuery.isLoading ? (
                  <div className="profile-empty-state">
                    <span className="profile-empty-state__icon">⏳</span>
                    <p className="profile-empty-state__text">Đang tải danh sách trang bị...</p>
                  </div>
                ) : myOwnedEquipments.length === 0 ? (
                  <div className="profile-empty-state">
                    <span className="profile-empty-state__icon">🎒</span>
                    <p className="profile-empty-state__text">
                      Bạn chưa sở hữu trang bị nào trong tủ đồ.
                    </p>
                    <p style={{ fontSize: "13px", color: "#785a43", margin: "4px 0 0" }}>
                      Hãy dùng xu tích lũy để sắm thêm các trang bị độc đáo tại Cửa hàng!
                    </p>
                  </div>
                ) : (
                  <div className="profile-inventory-grid">
                    {myOwnedEquipments.map((item) => {
                      const isEquipped = equippedSet.has(item.id);
                      return (
                        <div key={item.id} className="profile-inventory-slot">
                          <div className="profile-inventory-slot__img-wrap">
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.name || "Vật phẩm"}
                                width={56}
                                height={56}
                                className="profile-inventory-slot__img"
                                unoptimized
                              />
                            ) : (
                              <span className="profile-inventory-slot__icon">🎁</span>
                            )}
                          </div>
                          <span className="profile-inventory-slot__name">
                            {item.name || "Vật phẩm"}
                          </span>
                          <span
                            className="profile-inventory-slot__status"
                            style={{
                              background: isEquipped ? "#22c55e" : "#e2e8f0",
                              color: isEquipped ? "#ffffff" : "#475569",
                              fontWeight: 700,
                            }}
                          >
                            {isEquipped ? "✓ Đang mặc" : "Đã sở hữu"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="profile-inventory-panel__cta">
                  <Link href="/inventory" className="profile-game-btn profile-game-btn--primary">
                    <span>🎮 Thử Đồ / Tủ Đồ</span>
                  </Link>
                  <Link href="/gio-hang" className="profile-game-btn profile-game-btn--secondary">
                    <span>🛒 Ghé Cửa Hàng</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 2: TRẠNG THÁI ĐƠN HÀNG (SẢN PHẨM ĐẶC BIỆT)      */}
            {/* ---------------------------------------------------- */}
            {activeTab === "orders" && (
              <div className="profile-orders-panel">
                <div className="profile-orders-panel__header">
                  <Link href="/gio-hang" className="profile-orders-panel__shop-link">
                    <ShoppingOutlined /> Cửa hàng
                  </Link>
                </div>

                {isLoadingOrders ? (
                  <div className="profile-empty-state">
                    <span className="profile-empty-state__icon">⏳</span>
                    <p className="profile-empty-state__text">Đang tải lịch sử đơn hàng...</p>
                  </div>
                ) : specialOrders.length === 0 ? (
                  <EmptyState
                    icon="🎁"
                    title="Chưa có đơn đặt quà"
                    description="Các sản phẩm đặc biệt (quà tặng hiện vật yêu cầu thông tin liên lạc để Admin liên hệ trao quà) sẽ được theo dõi tiến độ duyệt tại đây!"
                    actionText="Ghé Cửa Hàng"
                    actionHref="/gio-hang"
                  />
                ) : (
                  <div className="profile-orders-list">
                    {specialOrders.map((ord) => (
                      <div key={ord.id} className="profile-order-card">
                        <div className="profile-order-card__left">
                          <div className="profile-order-card__img-wrap">
                            <Image
                              src={ord.item?.imageUrl || "/images/news-steam-lab.jpg"}
                              alt={ord.item?.name || "Vật phẩm"}
                              width={54}
                              height={54}
                              className="profile-order-card__img"
                              unoptimized
                            />
                          </div>
                          <div className="profile-order-card__info">
                            <div className="profile-order-card__name">
                              <span>{ord.item?.name || "Vật phẩm"}</span>
                              {ord.isSpecial && (
                                <span className="profile-order-card__special-tag">
                                  ⭐ ĐẶC BIỆT
                                </span>
                              )}
                            </div>
                            <span className="profile-order-card__date">
                              Ngày mua: {new Date(ord.createdAt).toLocaleString("vi-VN")}
                            </span>
                            {ord.contactInfo && (
                              <span className="profile-order-card__contact">
                                📞 Thông tin liên lạc: {ord.contactInfo}
                              </span>
                            )}
                            {ord.note && (
                              <span className="profile-order-card__note">
                                💬 Lời nhắn: {ord.note}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="profile-order-card__right">
                          <span className="profile-order-card__price">
                            <CoinIcon size={14} /> {ord.coinPrice} Xu
                          </span>
                          <span
                            className={`profile-order-card__status profile-order-card__status--${ord.status.toLowerCase()}`}
                          >
                            {ord.status === "PENDING" && "⏳ Chờ duyệt"}
                            {ord.status === "PROCESSING" && "🚚 Đang xử lý"}
                            {ord.status === "COMPLETED" && "✅ Đã nhận quà"}
                            {ord.status === "CANCELLED" && "❌ Đã hủy"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 3: THÔNG TIN TÀI KHOẢN                            */}
            {/* ---------------------------------------------------- */}
            {activeTab === "info" && (
              <div className="profile-info-panel">
                <dl className="profile-info-grid">
                  <div className="profile-info-item">
                    <dt className="profile-info-item__label">Tên tài khoản</dt>
                    <dd className="profile-info-item__val">{user.username}</dd>
                  </div>

                  <div className="profile-info-item">
                    <dt className="profile-info-item__label">Giới tính</dt>
                    <dd className="profile-info-item__val">{genderDisplay}</dd>
                  </div>

                  <div className="profile-info-item">
                    <dt className="profile-info-item__label">Đang ở nhóm nào</dt>
                    <dd className="profile-info-item__val">
                      {group ? (
                        <span className="profile-info-group-badge">
                          👥 <strong>{group.name}</strong>{" "}
                          <span className="profile-info-group-role">
                            {group.isOwner ? "👑 (Chủ nhóm)" : "🤝 (Thành viên)"}
                          </span>
                        </span>
                      ) : (
                        <span className="profile-info-group-empty">
                          Chưa tham gia nhóm{" "}
                          <Link href="/ban-be" className="profile-info-group-link">
                            (Tìm nhóm ↗)
                          </Link>
                        </span>
                      )}
                    </dd>
                  </div>

                  <div className="profile-info-item">
                    <dt className="profile-info-item__label">Số xu tích lũy</dt>
                    <dd className="profile-info-item__val" style={{ color: "#a75b1f", fontWeight: 800 }}>
                      <CoinIcon size={16} /> {(user.coins ?? 0).toLocaleString("vi-VN")} Xu
                    </dd>
                  </div>

                  <div className="profile-info-item">
                    <dt className="profile-info-item__label">Chuỗi đăng nhập</dt>
                    <dd className="profile-info-item__val" style={{ color: "#e84118", fontWeight: 800 }}>
                      🔥 {user.streak ?? 0} ngày liên tiếp
                    </dd>
                  </div>

                  <div className="profile-info-item">
                    <dt className="profile-info-item__label">Ngày tham gia</dt>
                    <dd className="profile-info-item__val">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </dd>
                  </div>
                </dl>

                <div className="profile-info-panel__actions">
                  <Link href="/ban-be" className="profile-game-btn profile-game-btn--secondary">
                    <span>👥 Bạn Bè</span>
                  </Link>
                  <Link href="/gio-hang" className="profile-game-btn profile-game-btn--primary">
                    <span>🛒 Ghé Cửa Hàng</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
