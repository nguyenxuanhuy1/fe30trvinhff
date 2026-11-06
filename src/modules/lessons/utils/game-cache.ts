import type { LessonDetail } from "../types";
import { getLesson } from "../services/lessons.service";

// =============================================================================
// LƯU BÀI HỌC TRÊN THIẾT BỊ NGƯỜI DÙNG (IndexedDB)
//
// Mục tiêu: lần mở bài thứ 2 trở đi hiện ngay, không phải chờ tải lại.
// Nguyên tắc an toàn (tránh trang đen / không tải được):
//  - Bản lưu chỉ là "bản dự phòng hiện trước". Mỗi lần mở bài vẫn hỏi máy chủ bản mới
//    (xem hooks/use-game-lesson.ts), bản lưu không bao giờ là nguồn sự thật duy nhất.
//  - Mọi thao tác IndexedDB đều có thời gian chờ tối đa và không bao giờ ném lỗi:
//    IndexedDB hỏng, bị chặn (chế độ ẩn danh), hết dung lượng... thì coi như không có
//    bản lưu và tải từ máy chủ như bình thường.
//  - Bản lưu sai cấu trúc, khác phiên bản định dạng hoặc quá cũ đều bị bỏ.
// =============================================================================

const DB_NAME = "project30tr_game_cache";
const DB_VERSION = 1;
const STORE_NAME = "cached_games";

/** Tăng số này khi đổi cấu trúc dữ liệu bài học: mọi bản lưu cũ tự bị bỏ */
const RECORD_FORMAT = 2;
/** Bản lưu quá thời gian này thì bỏ, tránh giữ mãi bài đã cũ / tốn dung lượng máy */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 ngày
/** IndexedDB có lúc treo (Safari, ổ đĩa đầy...): quá thời gian này thì bỏ qua bản lưu */
const IDB_TIMEOUT_MS = 1500;

interface CachedGameRecord {
  id: string;
  data: LessonDetail;
  cachedAt: number;
  format?: number;
}

// Bản sao trong RAM: đọc nhanh hơn và vẫn chạy khi IndexedDB bị chặn
const memoryCache = new Map<string, CachedGameRecord>();
// Gộp các lần tải trước cùng một bài (rê chuột + chạm + bấm gọi liền nhau)
const preloadInFlight = new Map<string, Promise<LessonDetail | null>>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function withTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), IDB_TIMEOUT_MS);
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timer));
  });
}

function openGameDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  const opening = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        // Tab khác nâng cấp DB: đóng kết nối này để không chặn nhau, lần sau mở lại
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  dbPromise = withTimeout(opening, null).then((db) => {
    if (!db) dbPromise = null; // lỗi thì lần sau thử mở lại
    return db;
  });
  return dbPromise;
}

/** Bản lưu dùng được không: đúng bài, đủ trường cần để chạy, đúng định dạng, chưa quá cũ */
function isUsableRecord(record: unknown, lessonId: string): record is CachedGameRecord {
  if (!record || typeof record !== "object") return false;
  const r = record as Partial<CachedGameRecord>;
  const data = r.data as Partial<LessonDetail> | undefined;
  return (
    r.format === RECORD_FORMAT &&
    typeof r.cachedAt === "number" &&
    Date.now() - r.cachedAt < MAX_AGE_MS &&
    !!data &&
    data.id === lessonId &&
    typeof data.name === "string" &&
    typeof data.html === "string"
  );
}

/**
 * Bỏ ảnh Base64 trước khi lưu: trang chơi chỉ cần tên + html, ảnh bài nặng ~1MB
 * mà lưu vào máy thì chỉ tốn dung lượng (dễ chạm giới hạn lưu trữ của trình duyệt).
 */
function toSlimLesson(lesson: LessonDetail): LessonDetail {
  return {
    ...lesson,
    imageUrl: null,
    room: lesson.room ? { ...lesson.room, imageUrl: null } : lesson.room,
  };
}

function runStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | null> {
  return withTimeout(
    openGameDB().then(
      (db) =>
        new Promise<T | null>((resolve) => {
          if (!db) return resolve(null);
          try {
            const tx = db.transaction(STORE_NAME, mode);
            const req = action(tx.objectStore(STORE_NAME));
            tx.oncomplete = () => resolve(req ? (req.result as T) : null);
            tx.onerror = () => resolve(null);
            tx.onabort = () => resolve(null); // ví dụ hết dung lượng lưu trữ
          } catch {
            resolve(null);
          }
        }),
    ),
    null,
  );
}

/** Lấy bài đã lưu trên thiết bị. Không có / hỏng / quá cũ thì trả null (không bao giờ ném lỗi). */
export async function getCachedGame(lessonId: string): Promise<LessonDetail | null> {
  const inMem = memoryCache.get(lessonId);
  if (isUsableRecord(inMem, lessonId)) {
    return inMem.data;
  }
  memoryCache.delete(lessonId);

  const record = await runStore<CachedGameRecord | undefined>("readonly", (store) =>
    store.get(lessonId),
  );

  if (isUsableRecord(record, lessonId)) {
    memoryCache.set(lessonId, record);
    return record.data;
  }

  // Có bản lưu nhưng không dùng được (hỏng / cũ / khác định dạng): xoá cho sạch
  if (record) {
    void removeIfUnusable(lessonId);
  }
  return null;
}

/**
 * Xoá bản lưu hỏng, kiểm tra lại NGAY TRONG cùng giao dịch: nếu trong lúc đó bản mới
 * từ máy chủ đã được ghi đè vào thì giữ nguyên, không xoá nhầm bản mới.
 */
function removeIfUnusable(lessonId: string): Promise<null> {
  return runStore<undefined>("readwrite", (store) => {
    const req = store.get(lessonId);
    req.onsuccess = () => {
      if (req.result && !isUsableRecord(req.result, lessonId)) {
        store.delete(lessonId);
      }
    };
  }) as Promise<null>;
}

/** Lưu bài vào thiết bị để lần sau mở hiện ngay. Lỗi thì bỏ qua. */
export async function setCachedGame(lesson: LessonDetail): Promise<void> {
  if (!lesson || !lesson.id || typeof lesson.html !== "string") return;

  const record: CachedGameRecord = {
    id: lesson.id,
    data: toSlimLesson(lesson),
    cachedAt: Date.now(),
    format: RECORD_FORMAT,
  };

  memoryCache.set(lesson.id, record);
  await runStore("readwrite", (store) => store.put(record));
}

/** Xoá bản lưu của 1 bài (bài đã bị xoá / ẩn trên máy chủ, hoặc bản lưu hỏng) */
export async function removeCachedGame(lessonId: string): Promise<void> {
  memoryCache.delete(lessonId);
  await runStore("readwrite", (store) => store.delete(lessonId));
}

/** Bài này đã có bản lưu dùng được chưa */
export async function isGameCached(lessonId: string): Promise<boolean> {
  return (await getCachedGame(lessonId)) !== null;
}

/**
 * Tải trước và lưu bài (khi rê chuột / chạm vào bài trong danh sách).
 * Đã có bản lưu thì thôi, khi mở bài sẽ tự kiểm tra bản mới.
 */
export function preloadAndCacheGame(lessonId: string): Promise<LessonDetail | null> {
  const pending = preloadInFlight.get(lessonId);
  if (pending) return pending;

  const task = (async () => {
    try {
      const cached = await getCachedGame(lessonId);
      if (cached) return cached;

      const fresh = await getLesson(lessonId);
      if (fresh) {
        await setCachedGame(fresh);
        return fresh;
      }
      return null;
    } catch {
      // Tải trước thất bại không ảnh hưởng gì: khi bấm vào bài sẽ tải lại bình thường
      return null;
    } finally {
      preloadInFlight.delete(lessonId);
    }
  })();

  preloadInFlight.set(lessonId, task);
  return task;
}

/** Xoá sạch mọi bài đã lưu (bảo trì hoặc reset) */
export async function clearAllGameCache(): Promise<void> {
  memoryCache.clear();
  await runStore("readwrite", (store) => store.clear());
}
