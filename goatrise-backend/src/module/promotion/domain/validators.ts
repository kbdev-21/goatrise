import z from "zod";
import type { CouponDiscountType } from "../schema/coupons.schema.js";
import type { ComboDiscountType } from "../schema/combos.schema.js";

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

const comboDiscountTypes = ["FIXED", "PERCENTAGE"] satisfies ComboDiscountType[];

const ComboConditionSchema = z.object({
  targetType: z.enum(["ITEM", "PRODUCT", "COLLECTION"]),
  targetId: z.uuid(),
  quantity: z.number().int().positive()
});

export const CreateComboRequestSchema = z.object({
  code: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1).nullable().optional(),
  andConditions: z.array(ComboConditionSchema).min(1),
  discountType: z.enum(comboDiscountTypes),
  discountValue: z.number().int().positive(),
  isActive: z.boolean().optional()
});
export type CreateComboRequest = z.infer<typeof CreateComboRequestSchema>;

export const UpdateComboRequestSchema = z.object({
  code: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  andConditions: z.array(ComboConditionSchema).min(1).optional(),
  discountType: z.enum(comboDiscountTypes).optional(),
  discountValue: z.number().int().positive().optional(),
  isActive: z.boolean().optional()
});
export type UpdateComboRequest = z.infer<typeof UpdateComboRequestSchema>;
