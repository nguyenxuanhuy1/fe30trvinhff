"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/modules/auth";
import { useEquipStore } from "@/stores/equip-store";
import { getInventory } from "../services/inventory.service";

/**
 * Tủ đồ của tài khoản đang đăng nhập.
 *
 * Server là nguồn sự thật: mỗi lần có data, ta đẩy xuống store để store so
 * với localStorage và tự ghi đè nếu lệch. Đây là chỗ duy nhất ngoài
 * equip/unequip được phép ghi localStorage.
 */
function useInventory() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const hydrate = useEquipStore((state) => state.hydrate);
  const reconcileWithServer = useEquipStore((state) => state.reconcileWithServer);

  // Đọc localStorage trong effect, không đọc lúc render để tránh hydration mismatch
  useEffect(() => {
    hydrate(userId);
  }, [hydrate, userId]);

  const query = useQuery({
    queryKey: ["inventory", userId],
    queryFn: getInventory,
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const serverEquipped = query.data?.equipped;

  useEffect(() => {
    if (!userId || !serverEquipped) {
      return;
    }
    reconcileWithServer(userId, serverEquipped);
  }, [reconcileWithServer, serverEquipped, userId]);

  return {
    ...query,
    inventory: query.data ?? null,
  };
}

export { useInventory };
