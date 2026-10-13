import { create } from "zustand";

// Đồ đang mặc của panel trang bị, lưu ở localStorage dạng { slot: itemId }.
//
// QUY TẮC BẮT BUỘC - giống equip-store.ts:
//   1. KHÔNG đọc localStorage lúc render, chỉ đọc trong hydrate() và chỉ gọi
//      hydrate() từ useEffect, để không lệch giữa server và client.
//   2. Mọi thao tác bọc try/catch vì private mode / hết quota sẽ throw.
//   3. id không còn trong danh mục hoặc đã mất quyền sở hữu thì bỏ, không giữ
//      lại món không mặc được (do keep() của caller quyết định).
//
// Khác equip-store.ts: khoá không theo userId mà một khoá chung, vì panel này
// là trang trang bị đồ cục bộ. Server vẫn là nguồn sự thật cho bài thí nghiệm,
// nên mọi thay đổi ở đây đều gọi API kèm theo.

const STORAGE_KEY = "retro_equipped_items";

type EquippedMap = Record<string, string>;

function readStored(): EquippedMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);

    // Chỉ nhận object phẳng slot -> itemId, bỏ qua mọi thứ khác
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    const result: EquippedMap = {};
    for (const [slot, id] of Object.entries(parsed)) {
      if (typeof id === "string" && id.length > 0) {
        result[slot] = id;
      }
    }
    return result;
  } catch {
    // JSON hỏng hoặc không đọc được: coi như chưa mặc gì
    return {};
  }
}

function writeStored(equippedMap: EquippedMap): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(equippedMap));
    const ids = Object.values(equippedMap).filter((id): id is string => typeof id === "string" && id.length > 0);
    window.localStorage.setItem("equipped_items", JSON.stringify(ids));
  } catch {
    // Hết quota / private mode: mất cache thôi, server vẫn giữ đồ đang mặc
  }
}

function sameMap(a: EquippedMap, b: EquippedMap): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  return keysA.length === keysB.length && keysA.every((slot) => a[slot] === b[slot]);
}

interface RetroEquipState {
  equippedMap: EquippedMap;
  hydrated: boolean;

  /**
   * Đọc localStorage rồi lọc qua `keep`. Chỉ gọi từ useEffect.
   * Nếu `keep` loại bớt món thì ghi lại xuống storage cho khớp.
   */
  hydrate: (keep: (map: EquippedMap) => EquippedMap) => void;
  /** Mặc món cho slot, hoặc tháo nếu đang mặc đúng món đó */
  toggle: (slot: string, itemId: string) => void;
  /** Tháo một slot cụ thể, dùng khi server từ chối món đang mặc */
  clearSlot: (slot: string) => void;
  reset: () => void;
}

const useRetroEquipStore = create<RetroEquipState>((set, get) => ({
  equippedMap: {},
  hydrated: false,

  hydrate: (keep) => {
    if (get().hydrated) {
      return;
    }

    if (typeof window === "undefined") {
      set({ equippedMap: {}, hydrated: true });
      return;
    }

    const stored = readStored();
    const cleaned = keep(stored);

    set({ equippedMap: cleaned, hydrated: true });

    if (!sameMap(cleaned, stored)) {
      writeStored(cleaned);
    }
  },

  toggle: (slot, itemId) => {
    const current = get().equippedMap;
    const next = { ...current };

    if (next[slot] === itemId) {
      delete next[slot];
    } else {
      next[slot] = itemId;
    }

    writeStored(next);
    set({ equippedMap: next });
  },

  clearSlot: (slot) => {
    const current = get().equippedMap;

    if (!(slot in current)) {
      return;
    }

    const next = { ...current };
    delete next[slot];

    writeStored(next);
    set({ equippedMap: next });
  },

  reset: () => set({ equippedMap: {}, hydrated: false }),
}));

export { useRetroEquipStore, STORAGE_KEY as RETRO_EQUIPPED_STORAGE_KEY };
export type { EquippedMap };