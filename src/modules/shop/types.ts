export interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  coinPrice: number;
  isSpecial: boolean;
  stock: number | null;
  isActive: boolean;
  isOwned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableAsset {
  filename: string;
  url: string;
  slug: string;
  name: string;
}

export interface ShopOrder {
  id: string;
  userId: string;
  itemId: string;
  coinPrice: number;
  isSpecial: boolean;
  contactInfo: string | null;
  note: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  item?: ShopItem;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    coins?: number;
  };
}

export interface PurchasePayload {
  itemId: string;
  contactInfo?: string;
  note?: string;
}

export interface PurchaseResponse {
  order: ShopOrder;
  remainingCoins: number;
  message: string;
}

export interface CreateShopItemPayload {
  name: string;
  description?: string;
  imageUrl: string;
  coinPrice: number;
  isSpecial: boolean;
  stock?: number | null;
}

export interface UpdateShopItemPayload {
  name?: string;
  description?: string;
  imageUrl?: string;
  coinPrice?: number;
  isSpecial?: boolean;
  stock?: number | null;
  isActive?: boolean;
}

export interface AdminOrdersResponse {
  orders: ShopOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
