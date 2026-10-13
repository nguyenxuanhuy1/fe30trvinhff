"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import {
  getShopItems,
  getMyOrders,
  purchaseShopItem,
  type ShopItem,
  type ShopOrder,
} from "@/modules/shop";
import { toast } from "@/components/ui/game-toast";
import { CoinIcon } from "@/components/ui/coin-icon";
import "./cart.scss";

export function CartView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateCoins } = useAuth();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Mua hàng modal
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [contactInfo, setContactInfo] = useState("");
  const [note, setNote] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [contactError, setContactError] = useState("");

  const coins = user?.coins ?? 0;

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [itemsData, ordersData] = await Promise.all([
          getShopItems(),
          user ? getMyOrders().catch(() => []) : Promise.resolve([]),
        ]);
        setItems(itemsData);
        setOrders(ordersData);
      } catch {
        toast.error("Không thể tải danh sách sản phẩm. Vui lòng thử lại!");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [user]);

  useEffect(() => {
    if (selectedItem || showOrdersModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedItem, showOrdersModal]);

  const handleOpenBuyModal = (item: ShopItem) => {
    if (item.isOwned) {
      toast.info("Bạn đã sở hữu vật phẩm này rồi, không thể mua lại nữa.");
      return;
    }

    if (!user) {
      toast.info("Vui lòng đăng nhập để thực hiện mua sắm.");
      router.push("/login?next=/gio-hang");
      return;
    }

    if (coins < item.coinPrice) {
      toast.error(`Bạn không đủ xu! Cần ${item.coinPrice} xu nhưng bạn chỉ có ${coins} xu.`);
      return;
    }

    setSelectedItem(item);
    setContactInfo("");
    setNote("");
    setContactError("");
  };

  const handleCloseBuyModal = () => {
    if (isPurchasing) return;
    setSelectedItem(null);
    setContactInfo("");
    setNote("");
    setContactError("");
  };

  const handleConfirmPurchase = async () => {
    if (!selectedItem || !user) return;

    if (selectedItem.isSpecial && !contactInfo.trim()) {
      setContactError("Vui lòng nhập thông tin liên lạc (SĐT, Zalo, Email, Facebook hoặc Địa chỉ)");
      return;
    }

    setIsPurchasing(true);
    setContactError("");

    try {
      const res = await purchaseShopItem({
        itemId: selectedItem.id,
        contactInfo: selectedItem.isSpecial ? contactInfo.trim() : undefined,
        note: selectedItem.isSpecial ? note.trim() : undefined,
      });

      // Cập nhật số xu người dùng ngay lập tức
      updateCoins(res.remainingCoins);

      // Thêm đơn hàng vào danh sách đơn của tôi
      setOrders((prev) => [res.order, ...prev]);

      // Cập nhật trạng thái đã sở hữu cho sản phẩm này trong danh sách
      setItems((prev) =>
        prev.map((it) => (it.id === selectedItem.id ? { ...it, isOwned: true } : it))
      );

      // Làm mới dữ liệu Tủ đồ để cập nhật tức thì
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });

      toast.success(res.message);
      handleCloseBuyModal();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Có lỗi xảy ra khi mua hàng.";
      toast.error(msg || "Có lỗi xảy ra khi mua hàng.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="cart-page-root">
      {/* 1. Header phong cách game thanh gỗ */}
      <header className="cart-header">
        <div className="cart-header__left">
          <Link href="/lessons" className="cart-header__back-btn" aria-label="Quay lại">
            <svg
              className="cart-header__back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Quay lại</span>
          </Link>
        </div>

        <div className="cart-header__right">
          {user && orders.length > 0 && (
            <button
              type="button"
              className="cart-header__orders-btn"
              onClick={() => setShowOrdersModal(true)}
              title="Xem lịch sử đổi quà và mua hàng"
            >
              <span className="cart-header__orders-icon">📦</span>
              <span className="cart-header__orders-text">Đơn của tôi ({orders.length})</span>
            </button>
          )}

          <div className="cart-header__coins-badge" title="Số xu hiện có của bạn">
            <CoinIcon className="cart-header__coins-icon" />
            <span className="cart-header__coins-value">{coins.toLocaleString("vi-VN")} Xu</span>
          </div>
        </div>
      </header>

      {/* 2. Nội dung chính: Danh sách sản phẩm (không dùng tab) */}
      <main className="cart-content-container">
        {isLoading ? (
          <div className="cart-empty-state">
            <span className="cart-empty-state__icon">⏳</span>
            <p className="cart-empty-state__text">Đang tải danh sách vật phẩm...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="cart-empty-state">
            <span className="cart-empty-state__icon">🎁</span>
            <p className="cart-empty-state__text">Cửa hàng hiện chưa có vật phẩm nào được bày bán.</p>
          </div>
        ) : (
          <div className="cart-grid">
            {items.map((item) => {
              const canAfford = coins >= item.coinPrice;
              const isOwned = Boolean(item.isOwned);

              return (
                <div
                  key={item.id}
                  className={`cart-shop-card ui-game-card ${item.isSpecial ? "cart-shop-card--special ui-game-card--special" : ""} ${isOwned ? "cart-shop-card--owned" : ""}`}
                  onClick={() => {
                    if (isOwned) {
                      toast.info("Bạn đã sở hữu vật phẩm này rồi, không thể mua lại nữa.");
                      return;
                    }
                    handleOpenBuyModal(item);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (!isOwned) handleOpenBuyModal(item);
                    }
                  }}
                >
                  {/* Vùng ảnh tỉ lệ sát mép */}
                  <div className="cart-shop-card__thumb">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 25vw"
                        className="cart-shop-card__image"
                        unoptimized
                      />
                    ) : (
                      <div className="cart-shop-card__placeholder">
                        <span className="cart-shop-card__placeholder-icon">🎁</span>
                        <span className="cart-shop-card__placeholder-text">Chưa có ảnh</span>
                      </div>
                    )}
                    {isOwned && (
                      <div className="cart-shop-card__owned-badge">
                        <span>✓ ĐÃ SỞ HỮU</span>
                      </div>
                    )}
                  </div>

                  {/* Vùng thông tin sản phẩm */}
                  <div className="cart-shop-card__body">
                    <h3 className="cart-shop-card__title" title={item.name}>
                      {item.name}
                    </h3>

                    {/* Vùng chân card: Giá xu & Nút Mua */}
                    <div className="cart-card-footer">
                      <div className="cart-card-price" title={`Giá: ${item.coinPrice} Xu`}>
                        <CoinIcon className="cart-card-price__icon" />
                        <span className="cart-card-price__val">{item.coinPrice} Xu</span>
                      </div>

                      {isOwned ? (
                        <button
                          type="button"
                          className="cart-card-buy-btn cart-card-buy-btn--owned"
                          disabled
                          title="Bạn đã sở hữu vật phẩm này rồi"
                        >
                          Đã sở hữu
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`cart-card-buy-btn ${item.isSpecial ? "cart-card-buy-btn--special" : ""} ${!canAfford ? "cart-card-buy-btn--disabled" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBuyModal(item);
                          }}
                          disabled={!canAfford}
                          title={!canAfford ? "Bạn không đủ xu" : "Nhấp để đổi vật phẩm này"}
                        >
                          {canAfford ? "Mua Ngay" : "Thiếu Xu"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Modal Mua hàng (Game Parchment Modal) */}
      {selectedItem && (
        <div className="cart-modal-backdrop" onClick={handleCloseBuyModal}>
          <div className="cart-modal-board" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cart-modal-board__close"
              onClick={handleCloseBuyModal}
              disabled={isPurchasing}
              aria-label="Đóng"
            >
              ×
            </button>

            <h2 className="cart-modal-board__title">XÁC NHẬN MUA VẬT PHẨM</h2>

            <div className="cart-modal-board__product-preview">
              <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
                {selectedItem.imageUrl ? (
                  <Image
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    fill
                    className="cart-modal-board__preview-img"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                ) : (
                  <div
                    className="cart-modal-board__preview-img"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "24px",
                      background: "#dfc8af",
                    }}
                  >
                    🎁
                  </div>
                )}
              </div>
              <div className="cart-modal-board__preview-info">
                <h4 className="cart-modal-board__preview-name">{selectedItem.name}</h4>
                <p className="cart-modal-board__preview-price">
                  Giá: <CoinIcon size={16} /> {selectedItem.coinPrice} Xu
                </p>
              </div>
            </div>

            {/* Thông báo nếu là đồ dùng đặc biệt */}
            {selectedItem.isSpecial ? (
              <div className="cart-modal-board__special-alert">
                <span style={{ fontSize: "20px" }}>⭐</span>
                <div>
                  <strong>Vật phẩm ĐẶC BIỆT:</strong>
                  <p style={{ margin: "4px 0 0" }}>
                    Vật phẩm này yêu cầu thông tin liên lạc để Quản trị viên trao thưởng / liên hệ trực tiếp với bạn.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Form nhập thông tin liên lạc (BẮT BUỘC ĐỐI VỚI ĐỒ ĐẶC BIỆT) */}
            {selectedItem.isSpecial && (
              <div className="cart-modal-board__input-group">
                <label className="cart-modal-board__label" htmlFor="cartContactInput">
                  Thông tin liên lạc của bạn <span style={{ color: "#d0152c" }}>*</span>
                </label>
                <input
                  id="cartContactInput"
                  type="text"
                  className="cart-modal-board__input"
                  placeholder="Nhập SĐT, Zalo, Email, Facebook hoặc Địa chỉ nhận quà..."
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  disabled={isPurchasing}
                  autoFocus
                />
                {contactError && (
                  <span style={{ fontSize: "12.5px", color: "#b91c1c", fontWeight: 700 }}>
                    ⚠️ {contactError}
                  </span>
                )}
              </div>
            )}

            {/* Ghi chú thêm (tùy chọn) - CHỈ DÀNH CHO VẬT PHẨM ĐẶC BIỆT */}
            {selectedItem.isSpecial && (
              <div className="cart-modal-board__input-group">
                <label className="cart-modal-board__label" htmlFor="cartNoteInput">
                  Ghi chú thêm (tùy chọn):
                </label>
                <input
                  id="cartNoteInput"
                  type="text"
                  className="cart-modal-board__input"
                  placeholder="Lời nhắn cho Admin (nếu có)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isPurchasing}
                />
              </div>
            )}

            {/* Tóm tắt số xu */}
            <div className="cart-modal-board__summary">
              <span>Số xu hiện tại: {coins} Xu</span>
              <span style={{ color: "#166534" }}>Còn lại sau mua: {coins - selectedItem.coinPrice} Xu</span>
            </div>

            {/* Nút hành động */}
            <div className="cart-modal-board__actions">
              <button
                type="button"
                className="cart-modal-board__btn-cancel"
                onClick={handleCloseBuyModal}
                disabled={isPurchasing}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="cart-modal-board__btn-confirm"
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? "Đang xử lý..." : "Xác nhận Mua"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Lịch sử Đơn Hàng (khi người dùng bấm Đơn của tôi) */}
      {showOrdersModal && (

        <div className="cart-modal-backdrop" onClick={() => setShowOrdersModal(false)}>
          <div
            className="cart-modal-board cart-modal-board--orders"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cart-modal-board__close"
              onClick={() => setShowOrdersModal(false)}
              aria-label="Đóng"
            >
              ×
            </button>

            <h2 className="cart-modal-board__title">LỊCH SỬ ĐỔI VẬT PHẨM</h2>

            <div className="cart-orders-table cart-orders-table--modal">
              {orders.length === 0 ? (
                <div className="cart-empty-state">
                  <span className="cart-empty-state__icon">📜</span>
                  <p className="cart-empty-state__text">Bạn chưa thực hiện giao dịch mua vật phẩm nào.</p>
                </div>
              ) : (
                orders.map((ord) => {
                  const statusMap: Record<string, { label: string; className: string }> = {
                    PENDING: { label: "Chờ xử lý", className: "cart-order-card__status--pending" },
                    PROCESSING: { label: "Đang giao / xử lý", className: "cart-order-card__status--processing" },
                    COMPLETED: { label: "Đã hoàn thành", className: "cart-order-card__status--completed" },
                    CANCELLED: { label: "Đã hủy", className: "cart-order-card__status--cancelled" },
                  };
                  const st = statusMap[ord.status] || { label: ord.status, className: "" };

                  return (
                    <div key={ord.id} className="cart-order-card">
                      <div className="cart-order-card__left">
                        <div className="cart-order-card__thumb">
                          <Image
                            src={ord.item?.imageUrl || "/images/logo.png"}
                            alt={ord.item?.name || "Vật phẩm"}
                            fill
                            sizes="60px"
                            style={{ objectFit: "cover" }}
                            unoptimized
                          />
                        </div>
                        <div className="cart-order-card__meta">
                          <h3 className="cart-order-card__name">
                            {ord.item?.name || "Vật phẩm"}
                            {ord.isSpecial && (
                              <span style={{ fontSize: "11px", color: "#e67e22", fontWeight: 800 }}>
                                {" "}(⭐ ĐẶC BIỆT)
                              </span>
                            )}
                          </h3>
                          <p className="cart-order-card__date">
                            Thời gian: {new Date(ord.createdAt).toLocaleString("vi-VN")}
                          </p>
                          {ord.contactInfo && (
                            <p className="cart-order-card__contact">
                              📞 Liên lạc: {ord.contactInfo}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="cart-order-card__right">
                        <div className="cart-order-card__coins-spent">
                          <span>- {ord.coinPrice}</span>
                          <CoinIcon size={14} />
                        </div>
                        <span className={`cart-order-card__status ${st.className}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

