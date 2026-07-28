import axiosInstance from "@/api/axios-instance";
import type { Product } from "@/api/product/api";

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

// Cột gốc của một collection, không kèm relation (dùng cho parent/children không lồng sâu hơn)
export type CollectionSummary = {
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

// Product nhúng trong collection (base, không kèm items) - COLLECTION_RELATIONS
export type CollectionProduct = {
  id: string;
  slug: string;
  title: { vi: string; en: string };
  shortDescription: { vi: string; en: string };
  markdownDescription: { vi: string; en: string } | null;
  imgUrls: string[] | null;
  displayPrice: number | null;
  comparePrice: number | null;
  isActive: boolean;
  requiredAttributes: ("COLOR" | "SIZE")[];
  sold: number;
  createdAt: string;
  updatedAt: string;
};

// Shape trả về bởi GET /api/collections (findAllCollections, COLLECTION_RELATIONS)
export type Collection = CollectionSummary & {
  parent: CollectionSummary | null;
  children: CollectionSummary[];
  products: CollectionProduct[];
};

// Shape trả về bởi GET /api/collections/:id, /api/collections/by-slug/:slug (COLLECTION_DETAIL_RELATIONS)
// products = light Product (PRODUCT_LIGHT_RELATIONS: product + items)
export type CollectionDetail = CollectionSummary & {
  parent: CollectionSummary | null;
  children: CollectionSummary[];
  products: Product[];
};
