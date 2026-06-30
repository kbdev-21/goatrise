import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustItemStock,
  createItem,
  deleteItem,
  findItemById,
  findItemTransactions,
  findItems,
  importItem,
  updateItem,
  type AdjustItemStockRequest,
  type CreateItemRequest,
  type FindItemTransactionsParams,
  type ImportItemRequest,
  type UpdateItemRequest,
} from "@/api/item/api.ts";

export const itemKeys = {
  all: ["items"] as const,
  list: () => [...itemKeys.all, "list"] as const,
  detail: (itemId: string) => [...itemKeys.all, "detail", itemId] as const,
  transactions: (itemId: string, params?: FindItemTransactionsParams) =>
    [...itemKeys.all, itemId, "transactions", params] as const,
};

export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: findItems,
  });
}

export function useItem(itemId: string) {
  return useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => findItemById(itemId),
    enabled: !!itemId,
  });
}

export function useItemTransactions(itemId: string, params?: FindItemTransactionsParams) {
  return useQuery({
    queryKey: itemKeys.transactions(itemId, params),
    queryFn: () => findItemTransactions(itemId, params),
    enabled: !!itemId,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateItemRequest) => createItem(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, request }: { itemId: string; request: UpdateItemRequest }) =>
      updateItem(itemId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useImportItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, request }: { itemId: string; request: ImportItemRequest }) =>
      importItem(itemId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useAdjustItemStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, request }: { itemId: string; request: AdjustItemStockRequest }) =>
      adjustItemStock(itemId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
