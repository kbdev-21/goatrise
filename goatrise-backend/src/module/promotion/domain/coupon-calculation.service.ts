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

  // trả về đúng số tiền lẽ ra được giảm; cap để total không âm do calculateOrder lo
  return discount;
}