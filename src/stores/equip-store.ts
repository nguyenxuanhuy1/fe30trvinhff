import { create } from "zustand";

// Đồ đang mặc được nhớ ở localStorage để lần sau vào bài thí nghiệm không phải
// chờ server, preload ảnh được luôn.
//
// QUY TẮC BẮT BUỘC - localStorage KHÔNG BAO GIỜ là nguồn sự thật:
//   1. Chỉ ghi khi user equip/unequip thành công, hoặc khi server trả về khác
//      local (server thắng, ghi đè).
//   2. Không đọc localStorage lúc render đầu để tránh hydration mismatch.
//      hydrate() phải được gọi trong useEffect.
//   3. Mọi thao tác đều bọc try/catch vì private mode / hết quota sẽ throw.
//
// localStorage chỉ phục vụ 2 việc: hiển thị nhanh và preload ảnh.
// Cổng vào bài học luôn check lại ở DB, sửa localStorage không bypass được.

const STORAGE_PREFIX = "equipped:";
const storageKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

const SLUG_RE = /^[a-z0-9][a-z0-9_]*$/;

function readStored(userId: string): string[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Chỉ nhận slug hợp lệ, bỏ qua mọi thứ khác client tự chỉnh
    return parsed.filter((id): id is string => typeof id === "string" && SLUG_RE.test(id));
  } catch {
    return [];
  }
}

function writeStored(userId: string, equipped: string[]): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(equipped));
  } catch {
    // Hết quota hoặc private mode: mất cache thôi, server vẫn là nguồn thật
  }
}

interface EquipState {
  /** userId mà store đang phục vụ, null = chưa biết */
  userId: string | null;
  /** id đồ đang mặc, luôn sort tăng dần để so sánh ổn định */
  equipped: string[];
  /** đã đọc localStorage xong chưa, dùng để biết lúc nào được render ảnh */
  hydrated: boolean;

  /** Đọc localStorage. Chỉ gọi trong useEffect. */
  hydrate: (userId: string | null) => void;
  /** Ghi sau khi equip/unequip thành công, dùng đúng danh sách server trả về */
  applyServerEquipped: (userId: string, equipped: string[]) => void;
  /**
   * Cập nhật tức thì lúc optimistic, CHỈ trong bộ nhớ, KHÔNG ghi localStorage.
   * localStorage chỉ nhận giá trị server đã xác nhận qua applyServerEquipped,
   * nên request lỗi sẽ không để lại đồ ảo trong cache.
   */
  setOptimisticEquipped: (userId: string, equipped: string[]) => void;
  /** Trả về danh sách đang mặc hiện tại, dùng để rollback */
  getEquipped: () => string[];
  /** Server trả về khác local thì ghi đè local (server thắng) */
  reconcileWithServer: (userId: string, serverEquipped: string[]) => void;
  /** Xoá cache khi đổi tài khoản */
  clear: () => void;
}

const sameList = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const sortIds = (ids: string[]): string[] => [...new Set(ids)].sort((a, b) => a.localeCompare(b));

const useEquipStore = create<EquipState>((set, get) => ({
  userId: null,
  equipped: [],
  hydrated: false,

  hydrate: (userId) => {
    const current = get();

    // Đã hydrate đúng user này rồi thì không đọc lại
    if (current.userId === userId && current.hydrated) {
      return;
    }

    if (typeof window === "undefined" || !userId) {
      set({ userId: null, equipped: [], hydrated: true });
      return;
    }

    set({ userId, equipped: sortIds(readStored(userId)), hydrated: true });
  },

  applyServerEquipped: (userId, equipped) => {
    const next = sortIds(equipped);
    set({ userId, equipped: next, hydrated: true });
    writeStored(userId, next);
  },

  setOptimisticEquipped: (userId, equipped) => {
    set({ userId, equipped: sortIds(equipped), hydrated: true });
  },

  getEquipped: () => get().equipped,

  reconcileWithServer: (userId, serverEquipped) => {
    const next = sortIds(serverEquipped);

    if (sameList(get().equipped, next)) {
      return;
    }

    // Server là nguồn sự thật: lệch là ghi đè local
    set({ userId, equipped: next, hydrated: true });
    writeStored(userId, next);
  },

  clear: () => set({ userId: null, equipped: [], hydrated: false }),
}));

export { useEquipStore, STORAGE_PREFIX, storageKey };
