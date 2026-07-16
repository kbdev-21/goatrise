import { db } from "../../../core/db.js";

const baseCouponQuery = db.query.coupons.findFirst();
export type Coupon = NonNullable<Awaited<typeof baseCouponQuery>>;
