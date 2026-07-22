import { queryOptions } from "@tanstack/react-query";
import { findAllCollections, getCollectionById, getCollectionBySlug } from "@/api/collection/api";

export const collectionKeys = {
  all: ["collections"] as const,
  list: () => [...collectionKeys.all, "list"] as const,
  detail: (id: string) => [...collectionKeys.all, "detail", id] as const,
  detailBySlug: (slug: string) => [...collectionKeys.all, "detail", "by-slug", slug] as const,
};

// queryOptions: reuse cho cả loader (queryClient.ensureQueryData) lẫn component (useQuery)
export const collectionsQueryOptions = () =>
  queryOptions({
    queryKey: collectionKeys.list(),
    queryFn: findAllCollections,
  });

export const collectionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: collectionKeys.detail(id),
    queryFn: () => getCollectionById(id),
  });

export const collectionBySlugQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: collectionKeys.detailBySlug(slug),
    queryFn: () => getCollectionBySlug(slug),
  });
