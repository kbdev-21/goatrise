import { db } from "../../../core/db.js";

const baseCouponQuery = db.query.coupons.findFirst();
export type Coupon = NonNullable<Awaited<typeof baseCouponQuery>>;

const baseComboQuery = db.query.combos.findFirst();
export type Combo = NonNullable<Awaited<typeof baseComboQuery>>;
