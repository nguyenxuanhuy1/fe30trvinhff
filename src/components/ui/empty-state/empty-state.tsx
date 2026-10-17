"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import "./empty-state.scss";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionHref?: string;
  action?: ReactNode;
  className?: string;
  fullScreen?: boolean;
}

function EmptyState({
  icon = "📜",
  title,
  description,
  actionText,
  onAction,
  actionHref,
  action,
  className = "",
  fullScreen = false,
}: EmptyStateProps) {
  const containerClass = `general-empty-container ${fullScreen ? "general-empty-container--fullscreen" : ""} ${className}`.trim();

  return (
    <div className={containerClass} role="status">
      <div className="general-empty-card">
        {icon && (
          <div className="general-empty-card__icon-box">
            <span className="general-empty-card__icon">{icon}</span>
          </div>
        )}

        {title && <h3 className="general-empty-card__title">{title}</h3>}

        {description && (
          <div className="general-empty-card__desc">
            {typeof description === "string" ? <p style={{ margin: 0 }}>{description}</p> : description}
          </div>
        )}

        {(action || actionText) && (
          <div className="general-empty-card__action">
            {action ? (
              action
            ) : actionHref ? (
              <Link href={actionHref} className="general-empty-card__btn">
                {actionText}
              </Link>
            ) : onAction ? (
              <button type="button" onClick={onAction} className="general-empty-card__btn">
                {actionText}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
