import axiosInstance from "@/api/axios-instance";

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

// Shape trả về bởi GET /api/products (findAllProducts, PRODUCT_LIGHT_RELATIONS)
export type Product = {
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
  items: {
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
  }[];
};

// Shape trả về bởi GET /api/products/:id và /api/products/by-slug/:slug (getProductDetail*, PRODUCT_RELATIONS)
export type ProductDetail = {
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
  items: {
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
  }[];
  collections: {
    id: string;
    slug: string;
    type: "COLLECTION" | "CATEGORY" | "EVENT";
    title: { vi: string; en: string };
    shortDescription: { vi: string; en: string };
    imgUrl: string | null;
    isActive: boolean;
    priority: number;
    createdAt: string;
    updatedAt: string;
  }[];
};
