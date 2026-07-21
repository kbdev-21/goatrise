import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCombo,
  deleteCombo,
  findComboById,
  findCombos,
  updateCombo,
  type CreateComboRequest,
  type UpdateComboRequest,
} from "@/api/combo/api.ts";

export const comboKeys = {
  all: ["combos"] as const,
  list: () => [...comboKeys.all, "list"] as const,
  detail: (comboId: string) => [...comboKeys.all, "detail", comboId] as const,
};

export function useCombos() {
  return useQuery({
    queryKey: comboKeys.list(),
    queryFn: findCombos,
  });
}

export function useCombo(comboId: string) {
  return useQuery({
    queryKey: comboKeys.detail(comboId),
    queryFn: () => findComboById(comboId),
    enabled: !!comboId,
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateComboRequest) => createCombo(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comboKeys.all });
    },
  });
}

export function useUpdateCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comboId, request }: { comboId: string; request: UpdateComboRequest }) =>
      updateCombo(comboId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comboKeys.all });
    },
  });
}

export function useDeleteCombo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comboId: string) => deleteCombo(comboId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comboKeys.all });
    },
  });
}
