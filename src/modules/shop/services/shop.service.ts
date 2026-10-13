import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  AdminOrdersResponse,
  AvailableAsset,
  CreateShopItemPayload,
  PurchasePayload,
  PurchaseResponse,
  ShopItem,
  ShopOrder,
  UpdateShopItemPayload,
} from "../types";

/**
 * Lấy danh sách ảnh vật phẩm có sẵn trong public/items
 */
export async function getAvailableShopAssets(): Promise<AvailableAsset[]> {
  const res = await api.get<ApiResponse<AvailableAsset[]>>("/shop/admin/available-assets");
  return res.data.data;
}

/**
 * Lấy danh sách sản phẩm hiển thị trong cửa hàng
 */
export async function getShopItems(params?: { search?: string; all?: boolean }): Promise<ShopItem[]> {
  const res = await api.get<ApiResponse<ShopItem[]>>("/shop/items", { params });
  return res.data.data;
}

/**
 * Lấy chi tiết một sản phẩm
 */
export async function getShopItem(id: string): Promise<ShopItem> {
  const res = await api.get<ApiResponse<ShopItem>>(`/shop/items/${id}`);
  return res.data.data;
}

/**
 * Người dùng mua sản phẩm bằng xu
 */
export async function purchaseShopItem(payload: PurchasePayload): Promise<PurchaseResponse> {
  const res = await api.post<ApiResponse<PurchaseResponse>>("/shop/purchase", payload);
  return res.data.data;
}

/**
 * Người dùng xem lịch sử đơn hàng của mình
 */
export async function getMyOrders(): Promise<ShopOrder[]> {
  const res = await api.get<ApiResponse<ShopOrder[]>>("/shop/my-orders");
  return res.data.data;
}

/**
 * Admin: Tạo sản phẩm mới
 */
export async function createShopItem(payload: CreateShopItemPayload): Promise<ShopItem> {
  const res = await api.post<ApiResponse<ShopItem>>("/shop/admin/items", payload);
  return res.data.data;
}

/**
 * Admin: Cập nhật sản phẩm
 */
export async function updateShopItem(id: string, payload: UpdateShopItemPayload): Promise<ShopItem> {
  const res = await api.put<ApiResponse<ShopItem>>(`/shop/admin/items/${id}`, payload);
  return res.data.data;
}

/**
 * Admin: Xoá sản phẩm
 */
export async function deleteShopItem(id: string): Promise<void> {
  await api.delete<ApiResponse<null>>(`/shop/admin/items/${id}`);
}

/**
 * Admin: Lấy danh sách đơn hàng
 */
export async function getAdminOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminOrdersResponse> {
  const res = await api.get<ApiResponse<AdminOrdersResponse>>("/shop/admin/orders", { params });
  return res.data.data;
}

/**
 * Admin: Đổi trạng thái đơn hàng
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<ShopOrder> {
  const res = await api.put<ApiResponse<ShopOrder>>(`/shop/admin/orders/${orderId}/status`, { status });
  return res.data.data;
}
