import { defineRelationsPart } from "drizzle-orm";
import { orders } from "./orders.schema.js";
import { orderLines } from "./order-lines.schema.js";
import { coupons } from "../../promotion/schema/coupons.schema.js";

export const ordersRelations = defineRelationsPart({ orders, orderLines, coupons }, (r) => ({
  orders: {
    lines: r.many.orderLines({
      to: r.orderLines.orderId,
      from: r.orders.id
    }),
    coupon: r.one.coupons({
      to: r.coupons.id,
      from: r.orders.couponId
    })
  },

  orderLines: {
    order: r.one.orders({
      to: r.orders.id,
      from: r.orderLines.orderId
    })
  }
}));
