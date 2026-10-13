"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Spin,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  ReadOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import {
  getAdminOverviewStats,
  type AdminOverviewStats,
} from "@/modules/users";
import { GenderPieChart } from "./gender-pie-chart";

interface AdminOverviewPanelProps {
  onNavigateTab?: (tab: string) => void;
}

export function AdminOverviewPanel({ onNavigateTab }: AdminOverviewPanelProps) {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadStats() {
    setIsLoading(true);
    try {
      const data = await getAdminOverviewStats();
      setStats(data);
    } catch {
      message.error("Không thể tải dữ liệu thống kê tổng quan.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  const totalUsers = stats?.totalUsers ?? 0;
  const totalArticles = stats?.totalArticles ?? 0;
  const totalLessons = stats?.totalLessons ?? 0;
  const specialOrdersCount = stats?.specialOrdersCount ?? 0;
  const specialOrdersPending = stats?.specialOrdersPending ?? 0;
  const specialOrdersCompleted = stats?.specialOrdersCompleted ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const lessonsByRoom = stats?.lessonsByRoom ?? [];

  // Tính tỷ lệ hoàn tất đơn đặc biệt
  const specialCompletedPercent =
    specialOrdersCount > 0
      ? Math.round((specialOrdersCompleted / specialOrdersCount) * 100)
      : 0;

  return (
    <div className="admin-overview-panel">
      {/* HEADER THANH CÔNG CỤ */}
      <div className="admin-overview-panel__header">
        <div className="admin-overview-panel__header-left">
          <h2 className="admin-overview-panel__title">TỔNG QUAN HỆ THỐNG</h2>
        </div>
        <div className="admin-overview-panel__header-right">
          <Button
            type="primary"
            icon={<ReloadOutlined spin={isLoading} />}
            onClick={() => void loadStats()}
            loading={isLoading}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="admin-overview-panel__loading">
          <Spin size="large" />
          <span style={{ marginTop: 12, color: "#64748b" }}>Đang tải dữ liệu...</span>
        </div>
      ) : (
        <div className="admin-overview-panel__content">
          {/* 4 THẺ SỐ LIỆU CHÍNH (KEY METRICS) */}
          <div className="admin-overview-metrics-grid">
            {/* 1. NGƯỜI DÙNG */}
            <div className="admin-metric-card admin-metric-card--users">
              <div className="admin-metric-card__top">
                <div className="admin-metric-card__icon-box">
                  <TeamOutlined />
                </div>
              </div>
              <div className="admin-metric-card__content">
                <div className="admin-metric-card__value">{totalUsers}</div>
                <div className="admin-metric-card__label">Tổng số người dùng</div>
                <div className="admin-metric-card__breakdown">
                  <span>Nam: <strong>{stats?.gender.male ?? 0}</strong></span>
                  <span className="admin-metric-card__sep">•</span>
                  <span>Nữ: <strong>{stats?.gender.female ?? 0}</strong></span>
                  {(stats?.gender.other ?? 0) > 0 && (
                    <>
                      <span className="admin-metric-card__sep">•</span>
                      <span>Khác: <strong>{stats?.gender.other}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 2. TIN TỨC ĐÃ ĐĂNG */}
            <div className="admin-metric-card admin-metric-card--articles">
              <div className="admin-metric-card__top">
                <div className="admin-metric-card__icon-box">
                  <ReadOutlined />
                </div>
              </div>
              <div className="admin-metric-card__content">
                <div className="admin-metric-card__value">{totalArticles}</div>
                <div className="admin-metric-card__label">Bài tin tức</div>
              </div>
            </div>

            {/* 3. BÀI HỌC CẢ 4 LỚP */}
            <div className="admin-metric-card admin-metric-card--lessons">
              <div className="admin-metric-card__top">
                <div className="admin-metric-card__icon-box">
                  <BookOutlined />
                </div>
              </div>
              <div className="admin-metric-card__content">
                <div className="admin-metric-card__value">{totalLessons}</div>
                <div className="admin-metric-card__label">Tổng số bài học</div>
              </div>
            </div>

            {/* 4. ĐƠN HÀNG ĐẶC BIỆT */}
            <div className="admin-metric-card admin-metric-card--special">
              <div className="admin-metric-card__top">
                <div className="admin-metric-card__icon-box">
                  <GiftOutlined />
                </div>
              </div>
              <div className="admin-metric-card__content">
                <div className="admin-metric-card__value">{specialOrdersCount}</div>
                <div className="admin-metric-card__label">Đơn hàng đặc biệt</div>
                <div className="admin-metric-card__breakdown">
                  <span>
                    Chờ duyệt: <strong>{specialOrdersPending}</strong>
                  </span>
                  <span className="admin-metric-card__sep">•</span>
                  <span>
                    Hoàn tất: <strong>{specialOrdersCompleted}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI NỘI DUNG CHI TIẾT 2 CỘT */}
          <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
            {/* CỘT TRÁI: BIỂU ĐỒ GIỚI TÍNH & THỐNG KÊ ĐƠN HÀNG */}
            <Col xs={24} lg={12}>
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {/* 1. BIỂU ĐỒ TRÒN GIỚI TÍNH */}
                <GenderPieChart stats={stats?.gender ?? null} isLoading={isLoading} />

                {/* 2. CHI TIẾT ĐƠN HÀNG ĐẶC BIỆT */}
                <div className="admin-overview-subcard">
                  <div className="admin-overview-subcard__header">
                    <div className="admin-overview-subcard__title-wrap">
                      <GiftOutlined style={{ fontSize: 18, color: "#2563eb" }} />
                      <h3 className="admin-overview-subcard__title">
                        CHI TIẾT ĐƠN HÀNG ĐẶC BIỆT
                      </h3>
                    </div>
                  </div>
                  <div className="admin-overview-subcard__body">
                    <div className="admin-special-order-stats">
                      <div className="admin-special-stat-item">
                        <div className="admin-special-stat-item__label">
                          <GiftOutlined style={{ marginRight: 6, color: "#2563eb" }} />
                          Tổng đơn đặc biệt
                        </div>
                        <div className="admin-special-stat-item__num" style={{ color: "#2563eb" }}>
                          {specialOrdersCount}
                        </div>
                      </div>

                      <div className="admin-special-stat-item">
                        <div className="admin-special-stat-item__label">
                          <ClockCircleOutlined style={{ marginRight: 6, color: "#475569" }} />
                          Chờ duyệt
                        </div>
                        <div className="admin-special-stat-item__num" style={{ color: "#0f172a" }}>
                          {specialOrdersPending}
                        </div>
                      </div>

                      <div className="admin-special-stat-item">
                        <div className="admin-special-stat-item__label">
                          <CheckCircleOutlined style={{ marginRight: 6, color: "#2563eb" }} />
                          Đã hoàn tất
                        </div>
                        <div className="admin-special-stat-item__num" style={{ color: "#2563eb" }}>
                          {specialOrdersCompleted}
                        </div>
                      </div>

                      <div className="admin-special-stat-item">
                        <div className="admin-special-stat-item__label">
                          <ShoppingOutlined style={{ marginRight: 6, color: "#2563eb" }} />
                          Tổng toàn bộ đơn
                        </div>
                        <div className="admin-special-stat-item__num" style={{ color: "#2563eb" }}>
                          {totalOrders}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#475569" }}>
                        <span>Tiến độ hoàn tất</span>
                        <strong>{specialCompletedPercent}%</strong>
                      </div>
                      <Progress
                        percent={specialCompletedPercent}
                        strokeColor="#2563eb"
                      />
                    </div>
                  </div>
                </div>
              </Space>
            </Col>

            {/* CỘT PHẢI: CHI TIẾT BÀI HỌC CẢ 4 LỚP & ĐIỀU HƯỚNG NHANH */}
            <Col xs={24} lg={12}>
              <Space direction="vertical" size={20} style={{ width: "100%" }}>
                {/* 1. PHÂN BỐ BÀI HỌC CẢ 4 LỚP */}
                <div className="admin-overview-subcard">
                  <div className="admin-overview-subcard__header">
                    <div className="admin-overview-subcard__title-wrap">
                      <BookOutlined style={{ fontSize: 18, color: "#2563eb" }} />
                      <h3 className="admin-overview-subcard__title">
                        BÀI HỌC THEO PHÒNG
                      </h3>
                    </div>
                  </div>
                  <div className="admin-overview-subcard__body">
                    {lessonsByRoom.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
                        Chưa có dữ liệu phòng học.
                      </div>
                    ) : (
                      <div className="admin-room-lessons-list">
                        {lessonsByRoom.map((room, index) => {
                          const percent =
                            totalLessons > 0
                              ? Math.round((room.lessonCount / totalLessons) * 100)
                              : 0;
                          return (
                            <div key={room.roomId} className="admin-room-lesson-row">
                              <div className="admin-room-lesson-row__info">
                                <div className="admin-room-lesson-row__title">
                                  <span className="admin-room-lesson-row__index">#{index + 1}</span>
                                  <strong>{room.roomName}</strong>
                                </div>
                                <div className="admin-room-lesson-row__count">
                                  <span className="admin-room-lesson-row__num">
                                    {room.lessonCount}
                                  </span>{" "}
                                  <span className="admin-room-lesson-row__unit">bài học</span>
                                  <span className="admin-room-lesson-row__pct">({percent}%)</span>
                                </div>
                              </div>
                              <Progress
                                percent={percent}
                                size="small"
                                strokeColor="#2563eb"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="admin-room-lesson-summary">
                      <span>Tổng cộng:</span>
                      <strong>{totalLessons} bài</strong>
                    </div>
                  </div>
                </div>

                {/* 2. LỐI TẮT QUẢN TRỊ NHANH */}
                {onNavigateTab && (
                  <div className="admin-overview-subcard">
                    <div className="admin-overview-subcard__header">
                      <div className="admin-overview-subcard__title-wrap">
                        <h3 className="admin-overview-subcard__title">
                          TRUY CẬP NHANH
                        </h3>
                      </div>
                    </div>
                    <div className="admin-overview-subcard__body">
                      <div className="admin-overview-quick-links">
                        <button
                          type="button"
                          className="admin-quick-btn"
                          onClick={() => onNavigateTab("lessons")}
                        >
                          <BookOutlined style={{ color: "#2563eb", fontSize: 16 }} />
                          <span>Bài học</span>
                          <ArrowRightOutlined className="admin-quick-btn__arrow" />
                        </button>
                        <button
                          type="button"
                          className="admin-quick-btn"
                          onClick={() => onNavigateTab("users")}
                        >
                          <UserOutlined style={{ color: "#2563eb", fontSize: 16 }} />
                          <span>Tài khoản</span>
                          <ArrowRightOutlined className="admin-quick-btn__arrow" />
                        </button>
                        <button
                          type="button"
                          className="admin-quick-btn"
                          onClick={() => onNavigateTab("articles")}
                        >
                          <ReadOutlined style={{ color: "#2563eb", fontSize: 16 }} />
                          <span>Tin tức</span>
                          <ArrowRightOutlined className="admin-quick-btn__arrow" />
                        </button>
                        <button
                          type="button"
                          className="admin-quick-btn"
                          onClick={() => onNavigateTab("cart")}
                        >
                          <GiftOutlined style={{ color: "#2563eb", fontSize: 16 }} />
                          <span>Đơn hàng</span>
                          <ArrowRightOutlined className="admin-quick-btn__arrow" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Space>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}
