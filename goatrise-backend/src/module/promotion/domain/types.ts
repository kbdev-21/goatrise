import { coupons } from "../schema/coupons.schema.js";
import { combos } from "../schema/combos.schema.js";

export type CouponBase = typeof coupons.$inferSelect;
export type ComboBase = typeof combos.$inferSelect;

export type Coupon = CouponBase;

export type Combo = ComboBase;
