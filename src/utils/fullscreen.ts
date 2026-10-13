let isPseudoFullscreen = false;

/**
 * Kiểm tra xem thiết bị hiện tại có phải là iOS (iPhone, iPad, iPod) hay không.
 */
export function isIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Kiểm tra xem trình duyệt có đang ở chế độ toàn màn hình hay không (kể cả native lẫn pseudo trên iOS).
 */
export function isFullscreenActive(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  const doc = document as Document & {
    webkitFullscreenElement?: Element;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
  };
  const nativeFs = Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
  return nativeFs || isPseudoFullscreen;
}

/**
 * Yêu cầu bật toàn màn hình (ẩn thanh địa chỉ URL) và khóa xoay ngang màn hình (landscape).
 * Hỗ trợ native Fullscreen API và fallback chế độ giả lập toàn màn hình (Pseudo-Fullscreen) cho iPhone Safari.
 */
export async function enterFullscreenAndLockLandscape(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  let enteredNative = false;

  // 1. Kích hoạt toàn màn hình (Fullscreen) để ẩn thanh địa chỉ trình duyệt
  try {
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      mozFullScreenElement?: Element;
      msFullscreenElement?: Element;
    };
    const isFs = Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isFs) {
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };

      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
        enteredNative = true;
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
        enteredNative = true;
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
        enteredNative = true;
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
        enteredNative = true;
      }
    } else {
      enteredNative = true;
    }
  } catch (err) {
    console.warn("[Fullscreen] Native fullscreen not supported or rejected:", err);
  }

  // 2. Nếu thiết bị không hỗ trợ native Fullscreen (như iPhone Safari):
  // Kích hoạt Pseudo-Fullscreen (CSS Edge-to-Edge full viewport)
  if (!enteredNative) {
    isPseudoFullscreen = true;
    document.documentElement.classList.add("is-fullscreen", "is-pseudo-fullscreen");
    document.body.classList.add("is-fullscreen", "is-pseudo-fullscreen");

    // Cuộn nhẹ 1px để kích hoạt Safari ẩn thanh công cụ địa chỉ (collapsible minimal UI)
    try {
      window.scrollTo(0, 1);
    } catch {}

    window.dispatchEvent(new Event("fullscreenchange"));
    window.dispatchEvent(new Event("fullscreen-toggle"));
  }

  // 3. Không ép khóa xoay ngang màn hình để hỗ trợ xoay dọc linh hoạt
}

/**
 * Thoát chế độ toàn màn hình (như bấm ESC) và mở khóa xoay màn hình.
 */
export async function exitFullscreenAndUnlock(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  try {
    const doc = document as Document & {
      webkitFullscreenElement?: Element;
      mozFullScreenElement?: Element;
      msFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    };

    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    } else if (doc.mozFullScreenElement && doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
    } else if (doc.msFullscreenElement && doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  } catch (err) {
    console.warn("[Fullscreen] Failed to exit native fullscreen:", err);
  }

  if (isPseudoFullscreen) {
    isPseudoFullscreen = false;
    document.documentElement.classList.remove("is-fullscreen", "is-pseudo-fullscreen");
    document.body.classList.remove("is-fullscreen", "is-pseudo-fullscreen");

    try {
      window.scrollTo(0, 0);
    } catch {}

    window.dispatchEvent(new Event("fullscreenchange"));
    window.dispatchEvent(new Event("fullscreen-toggle"));
  }

  try {
    const screenOrientation = window.screen?.orientation as
      | (ScreenOrientation & {
          unlock?: () => void;
        })
      | undefined;

    if (screenOrientation && typeof screenOrientation.unlock === "function") {
      screenOrientation.unlock();
    }
  } catch (err) {
    console.warn("[Orientation] Failed to unlock orientation:", err);
  }
}

