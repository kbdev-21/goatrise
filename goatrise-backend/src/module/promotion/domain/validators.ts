import z from "zod";
import type { CouponDiscountType } from "../schema/coupons.schema.js";

const discountTypes = ["FIXED", "PERCENTAGE"] satisfies CouponDiscountType[];

export const CreateCouponRequestSchema = z.object({
  code: z.string().trim().min(1).max(50),
  discountType: z.enum(discountTypes),
  discountValue: z.number().int().positive(),
  minAppliablePrice: z.number().int().nonnegative().optional(),
  maxDiscountAmount: z.number().int().positive().optional(),
  maximalUsage: z.number().int().positive().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional()
});
export type CreateCouponRequest = z.infer<typeof CreateCouponRequestSchema>;

export const FindCouponsQuerySchema = z.object({
  search: z.string().optional(),
  isOutOfUse: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sort: z.string().default("createdAt:DESC"),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().default(20)
});
export type FindCouponsQuery = z.infer<typeof FindCouponsQuerySchema>;
