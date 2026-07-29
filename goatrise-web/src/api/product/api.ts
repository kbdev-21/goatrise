import axiosInstance from "@/api/axios-instance";
import type { CollectionBase } from "@/api/collection/api";

export async function findAllProducts(): Promise<Product[]> {
  const res = await axiosInstance.get<Product[]>("/api/products");
  return res.data;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const res = await axiosInstance.get<ProductDetail>(`/api/products/by-slug/${slug}`);
  return res.data;
}

export async function getProductById(id: string): Promise<ProductDetail> {
  const res = await axiosInstance.get<ProductDetail>(`/api/products/${id}`);
  return res.data;
}

// Base: cột gốc của product (mirror ProductBase backend)
export type ProductBase = {
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
  displayPriority: number;
  createdAt: string;
  updatedAt: string;
};

// Base: cột gốc của item (mirror ItemBase backend; web chỉ dùng item nhúng trong product)
export type ItemBase = {
  id: string;
  productId: string | null;
  sku: string;
  name: string;
  normalizedName: string;
  imgUrl: string | null;
  attributeValues: {
    COLOR?: string; // mã hex, cũng là key định danh biến thể
    SIZE?: string;
  };
  price: number;
  weight: number | null;
  stock: number;
  sold: number;
  displayPriority: number;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

// GET /api/products (findAllProducts, PRODUCT_RELATIONS: items)
export type Product = ProductBase & {
  items: ItemBase[];
};

// GET /api/products/:id, /api/products/by-slug/:slug (PRODUCT_FULL_RELATIONS: items + collections)
export type ProductDetail = Product & {
  collections: CollectionBase[];
};
