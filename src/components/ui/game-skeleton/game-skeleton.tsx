import React from "react";
import "./game-skeleton.scss";

interface GameCardSkeletonProps {
  count?: number;
  variant?: "image-card" | "lesson" | "shop";
}

export function GameCardSkeleton({ count = 8, variant = "shop" }: GameCardSkeletonProps) {
  if (variant === "image-card") {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="image-card image-card--skeleton" aria-hidden="true">
            <div className="image-card__link image-card__link--skeleton">
              <div className="image-card-skeleton__cover">
                <span className="image-card-skeleton__emblem">📖</span>
                <div className="image-card-skeleton__bar" />
              </div>
            </div>
          </li>
        ))}
      </>
    );
  }

  if (variant === "lesson") {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="level-lessons__item" aria-hidden="true">
            <div className="news-card news-card--skeleton">
              <div className="news-card__thumb news-card__thumb--skeleton">
                <span className="news-card-skeleton__watermark">📖</span>
              </div>
              <div className="news-card__body news-card__body--skeleton">
                <div className="news-card-skeleton__title" />
                <div className="news-card-skeleton__title news-card-skeleton__title--short" />
                <div className="news-card__footer news-card__footer--skeleton">
                  <div className="news-card-skeleton__heart" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </>
    );
  }

  // variant === "shop" (Mặc định cho cửa hàng)
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="cart-shop-card cart-shop-card--skeleton" aria-hidden="true">
          <div className="cart-shop-card__thumb cart-shop-card__thumb--skeleton">
            <span className="cart-shop-card-skeleton__watermark">🎁</span>
          </div>
          <div className="cart-shop-card__body cart-shop-card__body--skeleton">
            <div className="cart-shop-card-skeleton__title" />
            <div className="cart-card-footer cart-card-footer--skeleton">
              <div className="cart-shop-card-skeleton__price" />
              <div className="cart-shop-card-skeleton__btn" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function FriendsOverviewSkeleton() {
  return (
    <div className="friends-skeleton-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="friends-skeleton-slot">
          <div className="friends-skeleton-slot__avatar" />
          <div className="friends-skeleton-slot__name" />
          <div className="friends-skeleton-slot__status" />
        </div>
      ))}
    </div>
  );
}

export function NewsPageSkeleton() {
  return (
    <div className="news-page-skeleton" aria-hidden="true">
      <div className="news-skeleton-hero-split">
        {/* Cột trái: Lead card */}
        <div className="news-skeleton-lead">
          <div className="news-skeleton-lead__media" />
          <div className="news-skeleton-lead__body">
            <div className="news-skeleton-lead__date" />
            <div className="news-skeleton-lead__title" />
            <div className="news-skeleton-lead__desc" />
            <div className="news-skeleton-lead__desc news-skeleton-lead__desc--short" />
          </div>
        </div>

        {/* Cột phải: Sidebar feed items */}
        <div className="news-skeleton-sidebar">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="news-skeleton-sidebar-item">
              <div className="news-skeleton-sidebar-item__img" />
              <div className="news-skeleton-sidebar-item__content">
                <div className="news-skeleton-sidebar-item__date" />
                <div className="news-skeleton-sidebar-item__title" />
                <div className="news-skeleton-sidebar-item__desc" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tầng dưới: 3 thẻ tin tức khác */}
      <div className="news-skeleton-bottom-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="news-skeleton-bottom-card">
            <div className="news-skeleton-bottom-card__img" />
            <div className="news-skeleton-bottom-card__body">
              <div className="news-skeleton-bottom-card__date" />
              <div className="news-skeleton-bottom-card__title" />
              <div className="news-skeleton-bottom-card__desc" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export type { GameCardSkeletonProps };
