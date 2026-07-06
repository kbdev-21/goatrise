import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  calculateOrder,
  createOrder,
  findOrders,
  type CalculateOrderRequest,
  type CreateOrderRequest,
  type FindOrdersParams,
} from "@/api/order/api.ts";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params?: FindOrdersParams) => [...orderKeys.all, "list", params] as const,
  detail: (orderId: string) => [...orderKeys.all, "detail", orderId] as const,
};

export function useOrders(params?: FindOrdersParams) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => findOrders(params),
  });
}

export function useCalculateOrder() {
  return useMutation({
    mutationFn: (request: CalculateOrderRequest) => calculateOrder(request),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateOrderRequest) => createOrder(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
