"use client";

import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  PieController,
} from "chart.js";
import type { GenderStats } from "@/modules/users";

// Đăng ký các module cần thiết của Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, PieController);

interface GenderPieChartProps {
  stats: GenderStats | null;
  isLoading?: boolean;
}

export function GenderPieChart({ stats, isLoading = false }: GenderPieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !stats) return;

    // Hủy instance cũ trước khi render mới để tránh lỗi Canvas already in use
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const maleCount = stats.male;
    const femaleCount = stats.female;
    const otherCount = stats.other;
    const unspecifiedCount = stats.unspecified;
    const total = stats.total;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Nếu hệ thống chưa có user nào
    const hasData = total > 0;
    const chartLabels = hasData
      ? ["Nam", "Nữ", "Khác", "Chưa cập nhật"]
      : ["Chưa có dữ liệu"];
    const chartData = hasData
      ? [maleCount, femaleCount, otherCount, unspecifiedCount]
      : [1];
    const backgroundColors = hasData
      ? [
          "#3b82f6", // Xanh dương (Nam)
          "#ec4899", // Hồng phấn (Nữ)
          "#8b5cf6", // Tím (Khác)
          "#94a3b8", // Xám Slate (Chưa cập nhật)
        ]
      : ["#cbd5e1"];

    chartInstanceRef.current = new ChartJS(ctx, {
      type: "pie",
      data: {
        labels: chartLabels,
        datasets: [
          {
            data: chartData,
            backgroundColor: backgroundColors,
            borderColor: "#ffffff",
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 14,
              boxHeight: 14,
              color: "#334155",
              font: {
                size: 12,
                weight: "bold",
              },
              padding: 14,
            },
          },
          tooltip: {
            enabled: hasData,
            callbacks: {
              label: (item) => {
                const val = Number(item.raw) || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return ` ${item.label}: ${val} người (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [stats]);

  const total = stats?.total ?? 0;
  const calcPct = (count: number) =>
    total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="admin-gender-stats-card">
      <div className="admin-gender-stats-card__header">
        <div className="admin-gender-stats-card__title-wrap">
          <h3 className="admin-gender-stats-card__title">THỐNG KÊ GIỚI TÍNH</h3>
        </div>
      </div>

      <div className="admin-gender-stats-card__body">
        {/* Cột trái: Khung biểu đồ tròn */}
        <div className="admin-gender-stats-card__chart-col">
          {isLoading ? (
            <div className="admin-gender-stats-card__loading">
              <span>Đang tải...</span>
            </div>
          ) : (
            <div className="admin-gender-stats-card__canvas-box">
              <canvas ref={canvasRef} />
            </div>
          )}
        </div>

        {/* Cột phải: Các thẻ số liệu chi tiết */}
        <div className="admin-gender-stats-card__metrics-col">
          <div className="admin-gender-metric admin-gender-metric--total">
            <div className="admin-gender-metric__top">
              <span className="admin-gender-metric__label">TỔNG TÀI KHOẢN</span>
            </div>
            <div className="admin-gender-metric__value">{total}</div>
          </div>

          <div className="admin-gender-metric-grid">
            {/* Nam */}
            <div className="admin-gender-metric admin-gender-metric--male">
              <div className="admin-gender-metric__top">
                <span className="admin-gender-metric__label">NAM</span>
              </div>
              <div className="admin-gender-metric__value">
                {stats?.male ?? 0}
                <span className="admin-gender-metric__pct">({calcPct(stats?.male ?? 0)})</span>
              </div>
            </div>

            {/* Nữ */}
            <div className="admin-gender-metric admin-gender-metric--female">
              <div className="admin-gender-metric__top">
                <span className="admin-gender-metric__label">NỮ</span>
              </div>
              <div className="admin-gender-metric__value">
                {stats?.female ?? 0}
                <span className="admin-gender-metric__pct">({calcPct(stats?.female ?? 0)})</span>
              </div>
            </div>

            {/* Khác */}
            <div className="admin-gender-metric admin-gender-metric--other">
              <div className="admin-gender-metric__top">
                <span className="admin-gender-metric__label">KHÁC</span>
              </div>
              <div className="admin-gender-metric__value">
                {stats?.other ?? 0}
                <span className="admin-gender-metric__pct">({calcPct(stats?.other ?? 0)})</span>
              </div>
            </div>

            {/* Chưa cập nhật */}
            <div className="admin-gender-metric admin-gender-metric--unspecified">
              <div className="admin-gender-metric__top">
                <span className="admin-gender-metric__label">CHƯA RÕ</span>
              </div>
              <div className="admin-gender-metric__value">
                {stats?.unspecified ?? 0}
                <span className="admin-gender-metric__pct">
                  ({calcPct(stats?.unspecified ?? 0)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
