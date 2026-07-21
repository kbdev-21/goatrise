import axiosInstance from "@/api/axios-instance.ts";
import type { Item, ItemAttribute } from "@/api/item/api.ts";
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

export type CollectionType = "COLLECTION" | "CATEGORY" | "EVENT";

// Collection nhúng trong ProductDetail (mirror module/catalog/schema/collections.schema.ts)
export type ProductCollection = {
  id: string;
  slug: string;
  type: CollectionType;
  title: LanguageString;
  shortDescription: LanguageString;
  imgUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Mirror backend: module/catalog/domain/types.ts -> Product (PRODUCT_LIGHT_RELATIONS)
// bigint columns serialized as number; items nhúng không kèm field `product`
export type Product = {
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
  items: Omit<Item, "product">[];
};

// Mirror backend: module/catalog/domain/types.ts -> ProductDetail (PRODUCT_RELATIONS)
export type ProductDetail = Product & {
  collections: ProductCollection[];
};

export type CreateProductRequest = {
  slug: string;
  title: LanguageString;
  shortDescription: LanguageString;
  markdownDescription?: LanguageString;
  imgUrls?: string[];
  displayPrice?: number;
  comparePrice?: number;
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
  isActive?: boolean;
  requiredAttributes?: ItemAttribute[];
  itemIds?: string[];
};
