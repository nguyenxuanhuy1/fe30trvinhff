import type { LessonDetail } from "../types";
import { getLesson } from "../services/lessons.service";

const DB_NAME = "project30tr_game_cache";
const DB_VERSION = 1;
const STORE_NAME = "cached_games";

interface CachedGameRecord {
  id: string;
  data: LessonDetail;
  cachedAt: number;
}

// Fallback in-memory cache nếu IndexedDB bị chặn (ví dụ trong môi trường SSR hoặc Private Mode)
const memoryCache = new Map<string, CachedGameRecord>();

function openGameDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (err) => {
        console.warn("[GameCache] Không thể mở IndexedDB, dùng in-memory cache:", err);
        resolve(null);
      };
    } catch (e) {
      console.warn("[GameCache] Lỗi khởi tạo IndexedDB:", e);
      resolve(null);
    }
  });
}

/**
 * Lấy trò chơi đã lưu trong cache của thiết bị
 */
export async function getCachedGame(lessonId: string): Promise<LessonDetail | null> {
  // 1. Kiểm tra RAM cache trước
  const inMem = memoryCache.get(lessonId);
  if (inMem?.data) {
    return inMem.data;
  }

  // 2. Kiểm tra IndexedDB
  const db = await openGameDB();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(lessonId);

      req.onsuccess = () => {
        const record = req.result as CachedGameRecord | undefined;
        if (record?.data) {
          // Sync lại vào RAM để lần sau đọc nhanh hơn nữa
          memoryCache.set(lessonId, record);
          resolve(record.data);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Lưu trò chơi vào cache của thiết bị để những lần sau vào chơi ngay lập tức
 */
export async function setCachedGame(lesson: LessonDetail): Promise<void> {
  if (!lesson || !lesson.id) return;

  const record: CachedGameRecord = {
    id: lesson.id,
    data: lesson,
    cachedAt: Date.now(),
  };

  // Lưu vào RAM
  memoryCache.set(lesson.id, record);

  // Lưu vào IndexedDB
  const db = await openGameDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(record);

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Kiểm tra xem trò chơi đã được tải và lưu trong cache chưa
 */
export async function isGameCached(lessonId: string): Promise<boolean> {
  if (memoryCache.has(lessonId)) return true;
  const game = await getCachedGame(lessonId);
  return game !== null;
}

/**
 * Tải và lưu trò chơi vào cache (dùng khi bấm vào bài hoặc khi rê chuột qua bài học)
 */
export async function preloadAndCacheGame(lessonId: string): Promise<LessonDetail | null> {
  try {
    // Nếu đã có trong cache rồi thì không cần gọi API nữa
    const cached = await getCachedGame(lessonId);
    if (cached) {
      return cached;
    }

    // Nếu chưa có, tải từ API và ghi vào cache
    const fresh = await getLesson(lessonId);
    if (fresh) {
      await setCachedGame(fresh);
      return fresh;
    }
    return null;
  } catch (error) {
    console.warn(`[GameCache] Không thể tải trước bài học ${lessonId}:`, error);
    return null;
  }
}

/**
 * Xóa sạch cache trò chơi (dành cho bảo trì hoặc reset)
 */
export async function clearAllGameCache(): Promise<void> {
  memoryCache.clear();
  const db = await openGameDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
