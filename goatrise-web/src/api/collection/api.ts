import axiosInstance from "@/api/axios-instance";
import type { Product, ProductBase } from "@/api/product/api";

export async function findAllCollections(): Promise<Collection[]> {
  const res = await axiosInstance.get<Collection[]>("/api/collections");
  return res.data;
}

export async function getCollectionBySlug(slug: string): Promise<CollectionDetail> {
  const res = await axiosInstance.get<CollectionDetail>(`/api/collections/by-slug/${slug}`);
  return res.data;
}

export async function getCollectionById(id: string): Promise<CollectionDetail> {
  const res = await axiosInstance.get<CollectionDetail>(`/api/collections/${id}`);
  return res.data;
}

// Base: cột gốc của collection (mirror CollectionBase backend; dùng cho parent/children không lồng sâu hơn)
export type CollectionBase = {
  id: string;
  slug: string;
  parentId: string | null;
  type: "COLLECTION" | "CATEGORY" | "EVENT";
  title: { vi: string; en: string };
  shortDescription: { vi: string; en: string };
  imgUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
};

// GET /api/collections (findAllCollections, COLLECTION_RELATIONS); products = ProductBase (không kèm items)
export type Collection = CollectionBase & {
  parent: CollectionBase | null;
  children: CollectionBase[];
  products: ProductBase[];
};

// GET /api/collections/:id, /api/collections/by-slug/:slug (COLLECTION_FULL_RELATIONS); products = Product (kèm items)
export type CollectionDetail = CollectionBase & {
  parent: CollectionBase | null;
  children: CollectionBase[];
  products: Product[];
};
