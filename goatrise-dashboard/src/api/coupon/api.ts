import axiosInstance from "@/api/axios-instance.ts";

export async function findCoupons(params?: FindCouponsParams): Promise<Coupon[]> {
  const res = await axiosInstance.get<Coupon[]>("/api/coupons", { params });
  return res.data;
}

export async function findCouponById(couponId: string): Promise<Coupon> {
  const res = await axiosInstance.get<Coupon>(`/api/coupons/${couponId}`);
  return res.data;
}

export async function createCoupon(request: CreateCouponRequest): Promise<Coupon> {
  const res = await axiosInstance.post<Coupon>("/api/coupons", request);
  return res.data;
}

export type CouponDiscountType = "FIXED" | "PERCENTAGE";

// Base: cột gốc của coupon (mirror CouponBase backend)
// bigint columns serialized as number; timestamps serialized as ISO string
export type CouponBase = {
  id: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minAppliablePrice: number;
  maxDiscountAmount: number | null;
  maximalUsage: number;
  usedCount: number;
  usedPhoneNums: string[];
  isActive: boolean;
  isOutOfUse: boolean;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Coupon = CouponBase;

export type FindCouponsParams = {
  search?: string;
  isOutOfUse?: boolean;
  sort?: string;
  offset?: number;
  limit?: number;
};

// Mirror backend: module/promotion/domain/validators.ts -> CreateCouponRequestSchema
export type CreateCouponRequest = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minAppliablePrice?: number;
  maxDiscountAmount?: number;
  maximalUsage?: number;
  startsAt?: string;
  expiresAt?: string;
};
