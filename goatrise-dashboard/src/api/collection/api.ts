import axiosInstance from "@/api/axios-instance.ts";
import type { LanguageString } from "@/core/types.ts";
import type { ItemAttribute } from "@/api/item/api.ts";
import type { ProductStatus } from "@/api/product/api.ts";

export async function findCollections(): Promise<Collection[]> {
  const res = await axiosInstance.get<Collection[]>("/api/collections");
  return res.data;
}

export async function findCollectionById(collectionId: string): Promise<Collection> {
  const res = await axiosInstance.get<Collection>(`/api/collections/${collectionId}`);
  return res.data;
}

export async function findCollectionBySlug(slug: string): Promise<Collection> {
  const res = await axiosInstance.get<Collection>(`/api/collections/by-slug/${slug}`);
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

export type CollectionStatus = "ACTIVE" | "INACTIVE";

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
  status: ProductStatus;
  requiredAttributes: ItemAttribute[];
  sold: number;
  createdAt: string;
  updatedAt: string;
};

// Mirror backend: module/catalog/domain/types.ts -> Collection (COLLECTION_RELATIONS)
export type Collection = {
  id: string;
  slug: string;
  type: CollectionType;
  title: LanguageString;
  shortDescription: LanguageString;
  imgUrl: string | null;
  status: CollectionStatus;
  createdAt: string;
  updatedAt: string;
  products: CollectionProduct[];
};

export type CreateCollectionRequest = {
  slug: string;
  type: CollectionType;
  title: LanguageString;
  shortDescription: LanguageString;
  imgUrl?: string;
  status?: CollectionStatus;
  productIds?: string[];
};

export type UpdateCollectionRequest = {
  slug?: string;
  type?: CollectionType;
  title?: LanguageString;
  shortDescription?: LanguageString;
  imgUrl?: string | null;
  status?: CollectionStatus;
  productIds?: string[];
};
