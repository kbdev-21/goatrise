import { db } from "../../../core/db.js";

export const ORDER_RELATIONS = {
  lines: true,
  coupon: true
};
const baseOrderQuery = db.query.orders.findFirst({
  with: ORDER_RELATIONS
});
export type Order = NonNullable<Awaited<typeof baseOrderQuery>>;
