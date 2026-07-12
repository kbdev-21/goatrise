import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCollection,
  deleteCollection,
  findCollectionById,
  findCollectionBySlug,
  findCollections,
  updateCollection,
  type CreateCollectionRequest,
  type UpdateCollectionRequest,
} from "@/api/collection/api.ts";

export const collectionKeys = {
  all: ["collections"] as const,
  list: () => [...collectionKeys.all, "list"] as const,
  detail: (collectionId: string) => [...collectionKeys.all, "detail", collectionId] as const,
  bySlug: (slug: string) => [...collectionKeys.all, "by-slug", slug] as const,
};

export function useCollections() {
  return useQuery({
    queryKey: collectionKeys.list(),
    queryFn: findCollections,
  });
}

export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: collectionKeys.detail(collectionId),
    queryFn: () => findCollectionById(collectionId),
    enabled: !!collectionId,
  });
}

export function useCollectionBySlug(slug: string) {
  return useQuery({
    queryKey: collectionKeys.bySlug(slug),
    queryFn: () => findCollectionBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCollectionRequest) => createCollection(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, request }: { collectionId: string; request: UpdateCollectionRequest }) =>
      updateCollection(collectionId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (collectionId: string) => deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
    },
  });
}
