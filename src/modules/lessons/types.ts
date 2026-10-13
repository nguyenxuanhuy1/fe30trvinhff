interface Room {
  id: string;
  name: string;
  imageUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  // Số bài học trong phòng, backend đếm sẵn để danh sách không phải gọi thêm
  _count: { lessons: number };
}

// Phiên bản phòng gọn, backend trả kèm khi lấy chi tiết bài học
interface RoomBasic {
  id: string;
  name: string;
  imageUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  roomId: string;
  name: string;
  imageUrl: string | null;
  order: number;
  slug?: string | null;
  path?: string | null;
  requiredSlots?: string[] | null;
  createdAt: string;
  updatedAt: string;
  isNew?: boolean;
  tag?: string | null;
  tags?: string[];
}

// Chi tiết bài học: có thêm mã html thuần để đưa vào iframe
interface LessonDetail extends Lesson {
  html: string;
  room: RoomBasic;
}

interface RoomPayload {
  name: string;
  imageUrl?: string;
  order?: number;
}

interface LessonPayload {
  name: string;
  imageUrl?: string;
  html?: string;
  order?: number;
}

export type { Room, RoomBasic, RoomPayload, Lesson, LessonDetail, LessonPayload };
