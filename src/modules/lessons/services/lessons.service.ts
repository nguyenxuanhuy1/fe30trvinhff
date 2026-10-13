import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type { Lesson, LessonDetail, LessonPayload, Room, RoomPayload } from "../types";

// Xem phòng và bài học là công khai, không cần đăng nhập
async function getRooms() {
  const res = await api.get<ApiResponse<Room[]>>("/rooms");
  return res.data.data;
}

async function getRoom(roomId: string) {
  const res = await api.get<ApiResponse<Room>>(`/rooms/${roomId}`);
  return res.data.data;
}

async function getLessons(roomId: string) {
  const res = await api.get<ApiResponse<Lesson[]>>(`/rooms/${roomId}/lessons`);
  return res.data.data;
}

// Bấm vào bài học thì gọi id để lấy html thuần
async function getLesson(lessonId: string) {
  const res = await api.get<ApiResponse<LessonDetail>>(`/lessons/${lessonId}`);
  return res.data.data;
}

// Các hàm dưới đây chỉ admin mới gọi được, backend trả 403 nếu không
async function createRoom(payload: RoomPayload) {
  const res = await api.post<ApiResponse<Room>>("/rooms", payload);
  return res.data.data;
}

async function updateRoom(roomId: string, payload: RoomPayload) {
  const res = await api.put<ApiResponse<Room>>(`/rooms/${roomId}`, payload);
  return res.data.data;
}

async function deleteRoom(roomId: string) {
  await api.delete(`/rooms/${roomId}`);
}

async function createLesson(roomId: string, payload: LessonPayload) {
  const res = await api.post<ApiResponse<Lesson>>(`/rooms/${roomId}/lessons`, payload);
  return res.data.data;
}

async function updateLesson(lessonId: string, payload: LessonPayload) {
  const res = await api.put<ApiResponse<LessonDetail>>(`/lessons/${lessonId}`, payload);
  return res.data.data;
}

async function deleteLesson(lessonId: string) {
  await api.delete(`/lessons/${lessonId}`);
}

export {
  getRooms,
  getRoom,
  getLessons,
  getLesson,
  createRoom,
  updateRoom,
  deleteRoom,
  createLesson,
  updateLesson,
  deleteLesson,
};
