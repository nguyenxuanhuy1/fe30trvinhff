"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { useEquipStore } from "@/stores/equip-store";
import {
  equipItem as equipItemRequest,
  unequipItem as unequipItemRequest,
} from "../services/inventory.service";
import type { CatalogItem, Inventory } from "../types";

type OptimisticContext = {
  previous: Inventory | undefined;
  previousEquipped: string[];
};

/**
 * Mặc / tháo đồ.
 *
 * Optimistic update đúng nghĩa: trước khi gọi API, ta tự tính `equipped` mới
 * (thay đồ cùng slot nếu đã mặc) rồi ghi ngay vào cả query cache lẫn store để UI
 * phản hồi tức thì. Thất bại thì rollback cả hai về ảnh chụp trước đó.
 *
 * Optimistic chỉ phục vụ hiển thị: store không ghi localStorage ở bước này, và
 * onSuccess vẫn ghi đè bằng đúng `equipped` server trả về rồi invalidate. Server
 * luôn là nguồn sự thật.
 */
function useEquip(catalog: CatalogItem[] = []) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const applyServerEquipped = useEquipStore((state) => state.applyServerEquipped);
  const setOptimisticEquipped = useEquipStore((state) => state.setOptimisticEquipped);

  const queryKey = ["inventory", userId];

  const slotByItem = new Map(catalog.map((item) => [item.id, item.slot]));

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey });
  }

  function rollback(context: OptimisticContext | undefined): void {
    if (context?.previous) {
      queryClient.setQueryData(queryKey, context.previous);
    } else {
      // Trước đó chưa có cache nghĩa là đang ở trạng thái rỗng: bỏ hẳn query
      // để lần fetch sau dựng lại từ server, không giữ dữ liệu sai.
      queryClient.removeQueries({ queryKey });
    }

    if (userId) {
      setOptimisticEquipped(userId, context?.previousEquipped ?? []);
    }
  }

  /**
   * Chụp trạng thái hiện tại rồi ghi trạng thái mới vào cả hai nơi.
   * `itemId = null` nghĩa là tháo đồ.
   */
  function pushOptimistic(itemId: string | null): OptimisticContext {
    const previous = queryClient.getQueryData<Inventory>(queryKey);
    const previousEquipped = previous?.equipped ?? useEquipStore.getState().getEquipped();

    let nextEquipped = previousEquipped;

    if (itemId !== null) {
      const slot = slotByItem.get(itemId);
      if (slot) {
        // Chỉ giữ tối đa 1 đồ mỗi slot: bỏ đồ cùng slot đang mặc rồi thêm mới.
        nextEquipped = [...previousEquipped.filter((id) => slotByItem.get(id) !== slot), itemId];
      }
      // Không xác định được slot (catalog chưa tải xong) thì giữ nguyên danh
      // sách và chờ server trả lời.
    } else {
      nextEquipped = [];
    }

    queryClient.setQueryData<Inventory>(queryKey, {
      owned: previous?.owned ?? [],
      equipped: sortIds(nextEquipped),
    });

    if (userId) {
      setOptimisticEquipped(userId, nextEquipped);
    }

    return { previous, previousEquipped };
  }

  const equip = useMutation({
    mutationFn: equipItemRequest,
    onMutate: (itemId) => pushOptimistic(itemId),
    onError: (_error, _itemId, context) => rollback(context as OptimisticContext | undefined),
    onSuccess: (data) => {
      if (userId) {
        applyServerEquipped(userId, data.equipped);
      }
    },
    onSettled: invalidate,
  });

  const unequip = useMutation({
    mutationFn: unequipItemRequest,
    onMutate: () => pushOptimistic(null),
    onError: (_error, _itemId, context) => rollback(context as OptimisticContext | undefined),
    onSuccess: (data) => {
      if (userId) {
        applyServerEquipped(userId, data.equipped);
      }
    },
    onSettled: invalidate,
  });

  return {
    equip,
    unequip,
    isEquipping: equip.isPending,
    isUnequipping: unequip.isPending,
  };
}

const sortIds = (ids: string[]): string[] => [...new Set(ids)].sort((a, b) => a.localeCompare(b));

export { useEquip };
