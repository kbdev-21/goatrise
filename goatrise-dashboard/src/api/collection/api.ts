import axiosInstance from "@/api/axios-instance.ts";
import type { LanguageString } from "@/core/types.ts";
import type { ItemAttribute } from "@/api/item/api.ts";
import type { Product } from "@/api/product/api.ts";

export async function findCollections(): Promise<Collection[]> {
  const res = await axiosInstance.get<Collection[]>("/api/collections");
  return res.data;
}

export async function findCollectionById(collectionId: string): Promise<CollectionDetail> {
  const res = await axiosInstance.get<CollectionDetail>(`/api/collections/${collectionId}`);
  return res.data;
}

export async function findCollectionBySlug(slug: string): Promise<CollectionDetail> {
  const res = await axiosInstance.get<CollectionDetail>(`/api/collections/by-slug/${slug}`);
  return res.data;
}

export async function createCollection(request: CreateCollectionRequest): Promise<Collection> {
  const res = await axiosInstance.post<Collection>("/api/collections", request);
  return res.data;
}

export async function updateCollection(collectionId: string, request: UpdateCollectionRequest): Promise<Collection> {
  const res = await axiosInstance.patch<Collection>(`/api/collections/${collectionId}`, request);
  return res.data;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  await axiosInstance.delete(`/api/collections/${collectionId}`);
}

export type CollectionType = "COLLECTION" | "CATEGORY" | "EVENT";

// Product nhúng trong Collection (mirror COLLECTION_RELATIONS -> products: true, base columns)
export type CollectionProduct = {
  id: string;
  slug: string;
  title: LanguageString;
  shortDescription: LanguageString;
  markdownDescription: LanguageString | null;
  imgUrls: string[] | null;
  displayPrice: number | null;
  comparePrice: number | null;
  isActive: boolean;
  requiredAttributes: ItemAttribute[];
  sold: number;
  createdAt: string;
  updatedAt: string;
};

// Cột gốc của một collection, không kèm relation (dùng cho parent/children không lồng sâu hơn)
export type CollectionSummary = {
  id: string;
  slug: string;
  parentId: string | null;
  type: CollectionType;
  title: LanguageString;
  shortDescription: LanguageString;
  imgUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
};

// Mirror backend: module/catalog/domain/types.ts -> Collection (COLLECTION_RELATIONS)
export type Collection = CollectionSummary & {
  parent: CollectionSummary | null;
  children: CollectionSummary[];
  products: CollectionProduct[];
};

// Mirror backend: module/catalog/domain/types.ts -> CollectionDetail (COLLECTION_DETAIL_RELATIONS)
// products = light Product (PRODUCT_LIGHT_RELATIONS: product + items)
export type CollectionDetail = CollectionSummary & {
  parent: CollectionSummary | null;
  children: CollectionSummary[];
  products: Product[];
};

export type CreateCollectionRequest = {
  slug: string;
  type: CollectionType;
  title: LanguageString;
  shortDescription: LanguageString;
  imgUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  displayPriority?: number;
  parentId?: string | null;
  productIds?: string[];
};

export type UpdateCollectionRequest = {
  slug?: string;
  type?: CollectionType;
  title?: LanguageString;
  shortDescription?: LanguageString;
  imgUrl?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  displayPriority?: number;
  parentId?: string | null;
  productIds?: string[];
};
