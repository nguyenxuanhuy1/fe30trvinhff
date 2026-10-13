"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
  LoadingOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { subscribeToasts, dismissToast, type ToastItem } from "./toast";
import "./GameToast.scss";

function renderToastIcon(type: ToastItem["type"]) {
  switch (type) {
    case "success":
      return <CheckCircleFilled className="game-toast__icon game-toast__icon--success" />;
    case "error":
      return <CloseCircleFilled className="game-toast__icon game-toast__icon--error" />;
    case "warning":
      return <ExclamationCircleFilled className="game-toast__icon game-toast__icon--warning" />;
    case "loading":
      return <LoadingOutlined className="game-toast__icon game-toast__icon--loading" />;
    case "info":
    default:
      return <InfoCircleFilled className="game-toast__icon game-toast__icon--info" />;
  }
}

export function GameToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return subscribeToasts((latest) => {
      setItems(latest);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="game-toast-container" aria-live="polite">
      {items.map((item) => (
        <div
          key={item.id}
          className={`game-toast game-toast--${item.type}`}
          role="status"
        >
          {renderToastIcon(item.type)}
          <span className="game-toast__text">{item.message}</span>
          <button
            type="button"
            className="game-toast__close"
            onClick={() => dismissToast(item.id)}
            aria-label="Đóng thông báo"
          >
            <CloseOutlined />
          </button>
        </div>
      ))}
    </div>
  );
}
