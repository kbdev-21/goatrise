import { HTTPException } from "hono/http-exception";
import type { DbExec } from "../../../core/db.js";
import type { CalculateOrderRequest } from "./validators.js";
import type { OrderLineSnapItem } from "../schema/order-lines.schema.js";
import { ITEM_RELATIONS, type Item } from "../../inventory/domain/types.js";
import { getCouponByCode } from "../../promotion/domain/coupons.service.js";
import { computeCouponDiscount } from "../../promotion/domain/coupon-calculation.service.js";
import type { Coupon } from "../../promotion/domain/types.js";

export type CalculateOrderResult = {
  lines: {
    itemId: string,
    productId: string | null,
    snapItem: OrderLineSnapItem,
    unitPrice: number,
    quantity: number,
    subtotal: number
  }[],

  subtotal: number,

  manualDiscount: number,
  couponDiscount: number,
  comboDiscount: number,

  shipping: number,
  tax: number,

  total: number
}

export async function calculateOrder(db: DbExec, req: CalculateOrderRequest): Promise<CalculateOrderResult> {
  const items = await db.query.items.findMany({
    where: {
      id: {
        in: req.lines.map((line) => line.itemId)
      }
    },
    with: ITEM_RELATIONS
  });

  const coupon = req.couponCode ? await getCouponByCode(db, req.couponCode) : null;

  return computeOrderPrice(
    items,
    req.lines,
    req.manualDiscountAmount ?? 0,
    req.manualShippingFee ?? 0,
    coupon,
    req.customerPhoneNum ?? "",
  );
}

function computeOrderPrice(
  itemsData: Item[],
  orderLines: {itemId: string, quantity: number}[],
  manualDiscountAmount: number,
  manualShippingFee: number,
  coupon: Coupon | null,
  orderPhoneNum: string,
): CalculateOrderResult {
  const itemsMap = new Map(itemsData.map((item) => [item.id, item]));

  const resultLines = [];
  let subtotal = 0;
  for (const line of orderLines) {
    const item = itemsMap.get(line.itemId);
    if (!item) {
      throw new HTTPException(404, { message: "Item not found" });
    }

    if (line.quantity > item.stock) {
      throw new HTTPException(409, { message: `Insufficient stock for item ${item.sku}` });
    }

    const lineSubtotal = item.price * line.quantity;
    subtotal = subtotal + lineSubtotal;

    const snapItem: OrderLineSnapItem = {
      sku: item.sku,
      name: item.name,
      imgUrl: item.imgUrl,
      attributeValues: item.attributeValues,
      price: item.price,
      product: item.product ? {
        slug: item.product.slug,
        title: item.product.title,
        imgUrls: item.product.imgUrls
      } : null
    };

    resultLines.push({
      itemId: item.id,
      productId: item.product?.id ?? null,
      snapItem: snapItem,
      unitPrice: item.price,
      quantity: line.quantity,
      subtotal: lineSubtotal
    });
  }

  const manualDiscount = manualDiscountAmount;
  const shipping = manualShippingFee;

  let couponDiscount = 0;
  if (coupon) {
    const discount = computeCouponDiscount(coupon, subtotal, orderPhoneNum);
    if (discount === false) {
      throw new HTTPException(400, { message: "Coupon not applicable" });
    }
    couponDiscount = discount;
  }

  const total = Math.max(subtotal - manualDiscount - couponDiscount + shipping, 0);

  return {
    lines: resultLines,
    subtotal: subtotal,
    manualDiscount: manualDiscount,
    couponDiscount: couponDiscount,
    comboDiscount: 0,
    shipping: shipping,
    tax: 0,
    total: total
  };
}
