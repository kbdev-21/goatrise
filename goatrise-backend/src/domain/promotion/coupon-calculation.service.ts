import type { Coupon } from "./types.js";

export function computeCouponDiscount(coupon: Coupon, orderSubtotal: number, orderPhoneNum: string): number | false {
  // coupon định danh người dùng qua phone (usedPhoneNums) -> đơn không có phone thì không
  // có danh tính để ràng buộc, cho apply sẽ khiến mọi đơn khuyết phone dùng chung khóa "".
  if (!orderPhoneNum) {
    return false;
  }
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