import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCoupon,
  findCouponById,
  findCoupons,
  type CreateCouponRequest,
  type FindCouponsParams,
} from "@/api/coupon/api.ts";

export const couponKeys = {
  all: ["coupons"] as const,
  list: (params?: FindCouponsParams) => [...couponKeys.all, "list", params] as const,
  detail: (couponId: string) => [...couponKeys.all, "detail", couponId] as const,
};

export function useCoupons(params?: FindCouponsParams) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => findCoupons(params),
  });
}

export function useCoupon(couponId: string) {
  return useQuery({
    queryKey: couponKeys.detail(couponId),
    queryFn: () => findCouponById(couponId),
    enabled: !!couponId,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCouponRequest) => createCoupon(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}
