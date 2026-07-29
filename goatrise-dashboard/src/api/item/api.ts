import axiosInstance from "@/api/axios-instance.ts";
import type { User } from "@/api/user/api.ts";
import type { Supplier } from "@/api/supplier/api.ts";
import type { ProductBase } from "@/api/product/api.ts";

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

export async function cloneItem(itemId: string): Promise<Item> {
  const res = await axiosInstance.post<Item>(`/api/items/${itemId}/clone`);
  return res.data;
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

export type ItemTransactionType = "IMPORT" | "ADJUST" | "SOLD";

export type ItemAttribute = "COLOR" | "SIZE";

export type ItemAttributeValues = {
  COLOR?: string; // mã hex, cũng là key định danh biến thể
  SIZE?: string;
};

// Base: cột gốc của item (mirror ItemBase backend, timestamps serialized as ISO string)
export type ItemBase = {
  id: string;
  productId: string | null;
  sku: string;
  name: string;
  normalizedName: string;
  note: string | null;
  imgUrl: string | null;
  attributeValues: ItemAttributeValues;
  isActive: boolean;
  price: number;
  weight: number | null;
  stock: number;
  sold: number;
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
};

// Item + product (ITEM_RELATIONS)
export type Item = ItemBase & {
  product: ProductBase | null;
};

// Base: cột gốc của item-transaction (mirror ItemTransactionBase backend, bigint serialized as number)
export type ItemTransactionBase = {
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
  importUnitCost: number | null;
  soldUnitPrice: number | null;
  createdAt: string;
};

// ItemTransaction + relations
export type ItemTransaction = ItemTransactionBase & {
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
  displayPriority?: number;
  isActive?: boolean;
  attributeValues: ItemAttributeValues;
};

export type UpdateItemRequest = {
  sku?: string;
  name?: string;
  note?: string;
  imgUrl?: string;
  weight?: number;
  productId?: string;
  price?: number;
  displayPriority?: number;
  isActive?: boolean;
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
