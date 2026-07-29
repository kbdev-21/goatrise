import axiosInstance from "@/api/axios-instance.ts";
import type { ItemBase, ItemAttribute } from "@/api/item/api.ts";
import type { CollectionBase } from "@/api/collection/api.ts";
import type { LanguageString } from "@/core/types.ts";

export async function findProducts(): Promise<Product[]> {
  const res = await axiosInstance.get<Product[]>("/api/products");
  return res.data;
}

export async function findProductById(productId: string): Promise<ProductDetail> {
  const res = await axiosInstance.get<ProductDetail>(`/api/products/${productId}`);
  return res.data;
}

export async function findProductBySlug(slug: string): Promise<ProductDetail> {
  const res = await axiosInstance.get<ProductDetail>(`/api/products/by-slug/${slug}`);
  return res.data;
}

export async function createProduct(request: CreateProductRequest): Promise<Product> {
  const res = await axiosInstance.post<Product>("/api/products", request);
  return res.data;
}

export async function updateProduct(productId: string, request: UpdateProductRequest): Promise<Product> {
  const res = await axiosInstance.patch<Product>(`/api/products/${productId}`, request);
  return res.data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await axiosInstance.delete(`/api/products/${productId}`);
}

// Base: cột gốc của product (mirror ProductBase backend)
// bigint columns serialized as number
export type ProductBase = {
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
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
};

// Product + items (PRODUCT_RELATIONS); items nhúng không kèm field `product`
export type Product = ProductBase & {
  items: ItemBase[];
};

// ProductDetail + collections (PRODUCT_FULL_RELATIONS)
export type ProductDetail = Product & {
  collections: CollectionBase[];
};

export type CreateProductRequest = {
  slug: string;
  title: LanguageString;
  shortDescription: LanguageString;
  markdownDescription?: LanguageString;
  imgUrls?: string[];
  displayPrice?: number;
  comparePrice?: number;
  displayPriority?: number;
  isActive?: boolean;
  requiredAttributes: ItemAttribute[];
  itemIds?: string[];
};

export type UpdateProductRequest = {
  slug?: string;
  title?: LanguageString;
  shortDescription?: LanguageString;
  markdownDescription?: LanguageString;
  imgUrls?: string[];
  displayPrice?: number;
  comparePrice?: number | null;
  displayPriority?: number;
  isActive?: boolean;
  requiredAttributes?: ItemAttribute[];
  itemIds?: string[];
};
