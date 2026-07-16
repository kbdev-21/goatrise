import type { Coupon } from "./types.js";

export function computeCouponDiscount(coupon: Coupon, orderSubtotal: number, orderPhoneNum: string): number | false {
  if (!coupon.isActive || coupon.isOutOfUse) {
    return false;
  }
  if (coupon.usedCount >= coupon.maximalUsage) {
    return false;
  }
  if (coupon.usedPhoneNums.includes(orderPhoneNum)) {
    return false;
  }
  if (orderSubtotal < coupon.minAppliablePrice) {
    return false;
  }

  let discount = coupon.discountType === "PERCENTAGE"
    ? Math.floor((orderSubtotal * coupon.discountValue) / 100)
    : coupon.discountValue;

  if (coupon.maxDiscountAmount !== null) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  // không discount orderPrice về dưới 0
  discount = Math.min(discount, orderSubtotal);

  return discount;
}