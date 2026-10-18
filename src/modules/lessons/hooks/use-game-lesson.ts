"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LessonDetail } from "../types";
import { getLesson } from "../services/lessons.service";
import { getCachedGame, setCachedGame } from "../utils/game-cache";

interface UseGameLessonOptions {
  lessonId: string;
  initialLesson?: LessonDetail | null;
}

export function useGameLesson({ lessonId, initialLesson }: UseGameLessonOptions) {
  const queryClient = useQueryClient();
  const [cachedData, setCachedData] = useState<LessonDetail | null>(initialLesson ?? null);

  // 1. Khi mount, kiểm tra ngay cache IndexedDB
  useEffect(() => {
    let isCancelled = false;

    if (initialLesson) {
      void setCachedGame(initialLesson);
      setCachedData(initialLesson);
      queryClient.setQueryData(["game-lesson", lessonId], initialLesson);
      return;
    }

    async function loadFromLocalCache() {
      const cached = await getCachedGame(lessonId);
      if (!isCancelled && cached) {
        setCachedData(cached);
        queryClient.setQueryData(["game-lesson", lessonId], cached);
      }
    }

    void loadFromLocalCache();

    return () => {
      isCancelled = true;
    };
  }, [lessonId, initialLesson, queryClient]);

  // 2. React Query: Nạp dữ liệu với cơ chế dùng Cache trước
  const query = useQuery<LessonDetail>({
    queryKey: ["game-lesson", lessonId],
    queryFn: async () => {
      // Ưu tiên đọc từ IndexedDB
      const cached = await getCachedGame(lessonId);
      if (cached) {
        return cached;
      }

      // Chưa có trong cache thì gọi API máy chủ
      const fresh = await getLesson(lessonId);
      // Lưu ngay vào cache của thiết bị
      void setCachedGame(fresh);
      return fresh;
    },
    initialData: initialLesson ?? cachedData ?? undefined,
    staleTime: 24 * 60 * 60 * 1000, // 24 giờ coi như dữ liệu luôn mới, không fetch lại
    gcTime: 7 * 24 * 60 * 60 * 1000, // Giữ trong RAM 7 ngày
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const lesson = query.data ?? cachedData ?? initialLesson ?? null;
  const isLoading = query.isLoading && !lesson;

  return {
    lesson,
    isLoading,
    isFromCache: Boolean(cachedData || (query.data && query.isFetchedAfterMount === false)),
    error: query.error,
    refetch: query.refetch,
  };
}
