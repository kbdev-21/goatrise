import type { OrderDb } from "../../db/schema/orders.schema.js";
import type { OrderLineDb } from "../../db/schema/order-lines.schema.js";
import type { CouponDb } from "../../db/schema/coupons.schema.js";

export type Order = OrderDb & {
  lines: OrderLineDb[],
  coupon: CouponDb | null
};
export const ORDER_RELATIONS = {
  lines: true,
  coupon: true
};
