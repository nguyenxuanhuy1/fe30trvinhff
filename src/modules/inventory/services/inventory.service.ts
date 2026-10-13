import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  EquippedResponse,
  Inventory,
  LabEnterResponse,
  LabLesson,
  LevelCompleteResponse,
} from "../types";

// Mọi endpoint của hệ tủ đồ/lab. Server luôn kiểm tra lại quyền và đồ đang
// mặc trong DB, client không được gửi kèm danh sách đồ để tin vào.
async function getInventory() {
  const res = await api.get<ApiResponse<Inventory>>("/inventory");
  return res.data.data;
}

async function equipItem(itemId: string) {
  const res = await api.post<ApiResponse<EquippedResponse>>("/inventory/equip", { itemId });
  return res.data.data;
}

async function unequipItem(itemId: string) {
  const res = await api.post<ApiResponse<EquippedResponse>>("/inventory/unequip", { itemId });
  return res.data.data;
}

async function completeLevel(lessonId: string) {
  const res = await api.post<ApiResponse<LevelCompleteResponse>>(`/levels/${lessonId}/complete`);
  return res.data.data;
}

async function listLessons() {
  const res = await api.get<ApiResponse<LabLesson[]>>("/lessons");
  // isPlugin suy ra từ path, không phải DB
  return res.data.data.map((lesson) => ({ ...lesson, isPlugin: Boolean(lesson.path) }));
}

async function enterLab(slug: string) {
  const res = await api.post<ApiResponse<LabEnterResponse>>(`/lab/enter/${encodeURIComponent(slug)}`);
  return res.data.data;
}

async function saveLabResult(labToken: string, result: unknown) {
  const res = await api.post<ApiResponse<{ id: string }>>("/lab/result", { labToken, result });
  return res.data.data;
}

export {
  getInventory,
  equipItem,
  unequipItem,
  completeLevel,
  listLessons,
  enterLab,
  saveLabResult,
};
