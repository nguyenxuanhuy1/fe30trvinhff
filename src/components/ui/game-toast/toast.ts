export type ToastType = "info" | "success" | "warning" | "error" | "loading";

export interface ToastItem {
  id: string;
  key?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export type ToastParam =
  | string
  | {
      content: string;
      key?: string;
      duration?: number;
    };

type ToastListener = (toasts: ToastItem[]) => void;

let listeners: ToastListener[] = [];
let toasts: ToastItem[] = [];
const timers = new Map<string, NodeJS.Timeout>();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export function subscribeToasts(listener: ToastListener) {
  listeners.push(listener);
  listener([...toasts]);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function dismissToast(idOrKey: string) {
  const existingTimer = timers.get(idOrKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
    timers.delete(idOrKey);
  }

  toasts = toasts.filter((t) => t.id !== idOrKey && t.key !== idOrKey);
  notify();
}

function parseParam(
  param: ToastParam,
  defaultDuration: number
): { message: string; key?: string; duration: number } {
  if (typeof param === "string") {
    return { message: param, duration: defaultDuration };
  }
  return {
    message: param.content,
    key: param.key,
    duration: param.duration !== undefined ? param.duration : defaultDuration,
  };
}

function showToast(param: ToastParam, type: ToastType = "info", defaultDuration = 4000) {
  const { message, key, duration } = parseParam(param, defaultDuration);
  const id = key || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Xóa timeout cũ nếu có toast trùng key
  if (timers.has(id)) {
    clearTimeout(timers.get(id)!);
    timers.delete(id);
  }

  const existingIndex = toasts.findIndex((t) => t.id === id || (key && t.key === key));

  if (existingIndex >= 0) {
    // Cập nhật toast hiện có (ví dụ: chuyển từ loading sang success)
    toasts[existingIndex] = {
      ...toasts[existingIndex],
      message,
      type,
      duration,
    };
  } else {
    // Tạo toast mới
    toasts = [...toasts, { id, key, message, type, duration }];
  }

  notify();

  // Đặt hẹn giờ tự động đóng nếu duration > 0 (loading mặc định duration = 0)
  if (duration > 0) {
    const timer = setTimeout(() => {
      dismissToast(id);
    }, duration);
    timers.set(id, timer);
  }

  return id;
}

export const toast = {
  show: (param: ToastParam, duration?: number) => showToast(param, "info", duration ?? 4000),
  info: (param: ToastParam, duration?: number) => showToast(param, "info", duration ?? 4000),
  success: (param: ToastParam, duration?: number) => showToast(param, "success", duration ?? 4000),
  warning: (param: ToastParam, duration?: number) => showToast(param, "warning", duration ?? 4000),
  error: (param: ToastParam, duration?: number) => showToast(param, "error", duration ?? 5000),
  loading: (param: ToastParam) => showToast(param, "loading", 0),
  dismiss: dismissToast,
};
