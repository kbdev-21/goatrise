import { infiniteQueryOptions, useMutation } from "@tanstack/react-query";
import { calculateOrder, findMyOrders, placeOrder } from "@/api/order/api";
import type {
  CalculateOrderRequest,
  PlaceOrderRequest,
} from "@/api/order/api";

export const orderKeys = {
  all: ["orders"] as const,
  // authUserId: tách cache theo tài khoản đăng nhập, đổi tài khoản không dính dữ liệu cũ
  mine: (authUserId: string) => [...orderKeys.all, "me", authUserId] as const,
};

const MY_ORDERS_PAGE_SIZE = 10;

// tải dần theo offset: trang trả về ít hơn PAGE_SIZE => đã hết đơn
export const myOrdersInfiniteQueryOptions = (authUserId: string) =>
  infiniteQueryOptions({
    queryKey: orderKeys.mine(authUserId),
    queryFn: ({ pageParam }) =>
      findMyOrders({ offset: pageParam, limit: MY_ORDERS_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < MY_ORDERS_PAGE_SIZE
        ? undefined
        : allPages.length * MY_ORDERS_PAGE_SIZE,
  });

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
