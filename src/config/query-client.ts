import { QueryClient } from "@tanstack/react-query";

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000, // 5 phút: Dữ liệu được coi là mới, khi chuyển trang sẽ DÙNG NGAY cache mà KHÔNG hiện loading
        gcTime: 30 * 60_000, // 30 phút lưu cache trong bộ nhớ RAM
        refetchOnMount: false, // Dùng ngay cache khi chuyển trang
        refetchOnWindowFocus: false, // Không tự refetch làm giật màn hình khi người dùng đổi tab
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });
}

export { createQueryClient };
