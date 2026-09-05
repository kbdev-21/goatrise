import { useMutation } from "@tanstack/react-query";
import { calculateOrder, placeOrder } from "@/api/order/api";
import type {
  CalculateOrderRequest,
  PlaceOrderRequest,
} from "@/api/order/api";

export const orderKeys = {
  all: ["orders"] as const,
};

export function useCalculateOrder() {
  return useMutation({
    mutationFn: (request: CalculateOrderRequest) => calculateOrder(request),
  });
}

export function usePlaceOrder() {
  return useMutation({
    mutationFn: (request: PlaceOrderRequest) => placeOrder(request),
  });
}
