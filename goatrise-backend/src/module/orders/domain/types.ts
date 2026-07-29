import { orders } from "../schema/orders.schema.js";
import { orderLines } from "../schema/order-lines.schema.js";
import type { CouponBase } from "../../promotion/domain/types.js";

export type OrderBase = typeof orders.$inferSelect;
export type OrderLineBase = typeof orderLines.$inferSelect;

export type Order = OrderBase & {
  lines: OrderLineBase[],
  coupon: CouponBase | null
};
export const ORDER_RELATIONS = {
  lines: true,
  coupon: true
};
