import axiosInstance from "@/api/axios-instance.ts";
import type { User } from "@/api/user/api.ts";
import type { Supplier } from "@/api/supplier/api.ts";
import type { LanguageString } from "@/core/types.ts";

export async function findItems(): Promise<Item[]> {
  const res = await axiosInstance.get<Item[]>("/api/items");
  return res.data;
}

export async function findItemById(itemId: string): Promise<Item> {
  const res = await axiosInstance.get<Item>(`/api/items/${itemId}`);
  return res.data;
}

export async function createItem(request: CreateItemRequest): Promise<Item> {
  const res = await axiosInstance.post<Item>("/api/items", request);
  return res.data;
}

export async function updateItem(itemId: string, request: UpdateItemRequest): Promise<Item> {
  const res = await axiosInstance.patch<Item>(`/api/items/${itemId}`, request);
  return res.data;
}

export async function deleteItem(itemId: string): Promise<void> {
  await axiosInstance.delete(`/api/items/${itemId}`);
}

export async function importItem(itemId: string, request: ImportItemRequest): Promise<Item> {
  const res = await axiosInstance.post<Item>(`/api/items/${itemId}/import`, request);
  return res.data;
}

export async function adjustItemStock(itemId: string, request: AdjustItemStockRequest): Promise<Item> {
  const res = await axiosInstance.post<Item>(`/api/items/${itemId}/adjust`, request);
  return res.data;
}

export async function findItemTransactions(
  itemId: string,
  params?: FindItemTransactionsParams
): Promise<ItemTransaction[]> {
  const res = await axiosInstance.get<ItemTransaction[]>(`/api/items/${itemId}/transactions`, { params });
  return res.data;
}

export type ItemStatus = "ACTIVE" | "INACTIVE";

export type ItemTransactionType = "IMPORT" | "ADJUST" | "SOLD";

export type ItemAttribute = "COLOR" | "SIZE";

export type ItemAttributeValues = {
  COLOR?: {
    hex: string;
    enText: string;
    viText: string;
  };
  SIZE?: string;
};

// Mirror backend: module/inventory/schema/items.schema.ts (timestamps serialized as ISO string)
export type Item = {
  id: string;
  productId: string | null;
  sku: string;
  name: string;
  normalizedName: string;
  note: string | null;
  imgUrl: string | null;
  attributeValues: ItemAttributeValues | null;
  status: ItemStatus;
  price: string;
  weight: number | null;
  stock: number;
  sold: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    slug: string;
    title: LanguageString;
    shortDescription: LanguageString;
    markdownDescription: LanguageString | null;
    imgUrls: string[] | null;
    displayPrice: string | null;
    comparePrice: string | null;
    status: "ACTIVE" | "INACTIVE";
    requiredAttributes: ItemAttribute[];
    sold: number;
    createdAt: string;
    updatedAt: string;
  } | null;
};

// Mirror backend: module/inventory/schema/item-transactions.schema.ts + ITEM_TRANSACTIONS_RELATIONS
// numeric columns are serialized as string
export type ItemTransaction = {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  actorId: string | null;
  supplierId: string | null;
  supplierName: string | null;
  type: ItemTransactionType;
  note: string | null;
  quantity: number;
  importUnitCost: string | null;
  soldUnitPrice: string | null;
  createdAt: string;
  item: Item;
  actor: User | null;
  supplier: Supplier | null;
};

export type CreateItemRequest = {
  sku: string;
  name: string;
  note?: string;
  imgUrl?: string;
  weight?: number;
  productId?: string;
  price: number;
  attributeValues?: ItemAttributeValues;
};

export type UpdateItemRequest = {
  sku?: string;
  name?: string;
  note?: string;
  imgUrl?: string;
  weight?: number;
  productId?: string;
  price?: number;
  attributeValues?: ItemAttributeValues;
};

export type ImportItemRequest = {
  quantity: number;
  importUnitCost: number;
  supplierId?: string;
  note?: string;
};

export type AdjustItemStockRequest = {
  stockChange: number;
  note: string;
};

export type FindItemTransactionsParams = {
  type?: ItemTransactionType;
  offset?: number;
  limit?: number;
};
