import axiosInstance from "@/api/axios-instance";

export async function findAllCollections(): Promise<Collection[]> {
  const res = await axiosInstance.get<Collection[]>("/api/collections");
  return res.data;
}

export async function getCollectionBySlug(slug: string): Promise<Collection> {
  const res = await axiosInstance.get<Collection>(`/api/collections/by-slug/${slug}`);
  return res.data;
}

export async function getCollectionById(id: string): Promise<Collection> {
  const res = await axiosInstance.get<Collection>(`/api/collections/${id}`);
  return res.data;
}

// Shape trả về bởi GET /api/collections, /api/collections/:id, /api/collections/by-slug/:slug (COLLECTION_RELATIONS)
export type Collection = {
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
  products: {
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
  }[];
};
