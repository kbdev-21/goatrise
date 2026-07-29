import axiosInstance from "@/api/axios-instance.ts";
import type { LanguageString } from "@/core/types.ts";
import type { Product, ProductBase } from "@/api/product/api.ts";

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

// Base: cột gốc của collection (mirror CollectionBase backend; dùng cho parent/children không lồng sâu hơn)
export type CollectionBase = {
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

// Collection + relations (COLLECTION_RELATIONS); products = ProductBase (không kèm items)
export type Collection = CollectionBase & {
  parent: CollectionBase | null;
  children: CollectionBase[];
  products: ProductBase[];
};

// CollectionDetail + relations (COLLECTION_FULL_RELATIONS); products = Product (kèm items)
export type CollectionDetail = CollectionBase & {
  parent: CollectionBase | null;
  children: CollectionBase[];
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
