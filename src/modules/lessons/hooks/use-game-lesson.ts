"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { LessonDetail } from "../types";
import { getLesson } from "../services/lessons.service";
import { getCachedGame, removeCachedGame, setCachedGame } from "../utils/game-cache";

interface UseGameLessonOptions {
  lessonId: string;
  /** Dữ liệu có sẵn (nếu có). Trang chơi bài hiện không truyền để tận dụng bản lưu trên máy. */
  initialLesson?: LessonDetail | null;
}

function getStatus(err: unknown): number | undefined {
  return isAxiosError(err) ? err.response?.status : undefined;
}

/**
 * Tải bài học theo kiểu "hiện bản đã lưu trước, kiểm tra bản mới sau":
 *
 * 1. Có bản lưu trên máy (IndexedDB) -> hiện ngay, không phải chờ mạng.
 * 2. Song song LUÔN hỏi máy chủ bản mới. Bài không đổi thì máy chủ trả 304 (trình duyệt
 *    tự dùng lại dữ liệu nhờ ETag), gần như không tốn dung lượng tải.
 * 3. Máy chủ lỗi / mất mạng mà có bản lưu -> vẫn chơi được bằng bản lưu, không hiện lỗi.
 * 4. Máy chủ báo bài không tồn tại / đã ẩn (404) -> xoá bản lưu, báo lỗi rõ ràng.
 * 5. Không có bản lưu và máy chủ lỗi -> hiện màn lỗi có nút thử lại.
 */
export function useGameLesson({ lessonId, initialLesson }: UseGameLessonOptions) {
  // Ghi kèm lessonId để chuyển sang bài khác không dùng nhầm bản lưu của bài trước
  const [cacheState, setCacheState] = useState<{ lessonId: string; data: LessonDetail | null } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void getCachedGame(lessonId).then((data) => {
      if (!cancelled) setCacheState({ lessonId, data });
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const cacheChecked = cacheState?.lessonId === lessonId;
  const cached = cacheChecked ? cacheState.data : null;

  const query = useQuery<LessonDetail>({
    queryKey: ["game-lesson", lessonId],
    queryFn: async () => {
      try {
        const fresh = await getLesson(lessonId);
        void setCachedGame(fresh);
        return fresh;
      } catch (err) {
        if (getStatus(err) === 404) {
          void removeCachedGame(lessonId);
        }
        throw err;
      }
    },
    initialData: initialLesson ?? undefined,
    // Mỗi lần mở bài đều kiểm tra bản mới (rẻ nhờ 304), nhưng không tự tải lại khi đổi tab
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Lỗi 4xx (không tồn tại, không có quyền) thử lại vô ích; lỗi mạng / 5xx thử thêm 2 lần
    retry: (failureCount, err) => {
      const status = getStatus(err);
      if (status !== undefined && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });

  const isGone = query.isError && getStatus(query.error) === 404;
  const fresh = query.data ?? null;
  const lesson = fresh ?? (isGone ? null : cached);

  // Chỉ báo lỗi khi đã chắc chắn không có gì để hiện
  const error = !lesson && query.isError && (cacheChecked || isGone) ? query.error : null;
  const isLoading = !lesson && !error;

  return {
    lesson,
    isLoading,
    isFromCache: !fresh && Boolean(cached),
    isGone,
    error,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
