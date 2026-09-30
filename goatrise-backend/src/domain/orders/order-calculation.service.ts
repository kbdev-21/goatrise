import { HTTPException } from "hono/http-exception";
import type { DbExec } from "../../db/db.js";
import type { CalculateOrderRequest } from "./validators.js";
import type { OrderLineSnapItem } from "../../db/schema/order-lines.schema.js";
import { ITEM_RELATIONS, type Item } from "../inventory/types.js";
import { getCouponByCode } from "../promotion/coupons.service.js";
import { computeCouponDiscount } from "../promotion/coupon-calculation.service.js";
import { calculateComboDiscount, type AppliedCombo } from "../promotion/combo-calculation.service.js";

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
  combos: AppliedCombo[],

  shipping: number,
  tax: number,

  total: number
}

// heldQuantities: số lượng mỗi item đang bị giữ bởi chính đơn đang sửa (đơn CONFIRMED đã trừ stock)
// -> cộng lại khi check tồn kho để preview không false-fail. Mặc định rỗng = check như bình thường.
export async function calculateOrder(
  db: DbExec,
  req: CalculateOrderRequest,
  heldQuantities: Map<string, number> = new Map()
): Promise<CalculateOrderResult> {
  const items = await db.query.items.findMany({
    where: {
      id: {
        in: req.lines.map((line) => line.itemId)
      }
    },
    with: ITEM_RELATIONS
  });

  const { lines, subtotal } = computeOrderLines(items, req.lines, heldQuantities);

  const manualDiscount = req.manualDiscountAmount ?? 0;
  const shipping = req.manualShippingFee ?? 0;

  // coupon trả về đúng số tiền lẽ ra được giảm (không tự cap ở subtotal)
  let couponDiscount = 0;
  if (req.couponCode) {
    const coupon = await getCouponByCode(db, req.couponCode);
    const discount = computeCouponDiscount(coupon, subtotal, req.customerPhoneNum ?? "");
    if (discount === false) {
      throw new HTTPException(400, { message: "Coupon not applicable" });
    }
    couponDiscount = discount;
  }

  // combo cũng trả về đúng số tiền lẽ ra được giảm (không tự cap ở subtotal)
  const combo = await calculateComboDiscount(db, subtotal, req.lines);

  // cap ở đây: total không được âm
  const total = Math.max(subtotal - manualDiscount - couponDiscount - combo.discount + shipping, 0);

  return {
    lines: lines,
    subtotal: subtotal,
    manualDiscount: manualDiscount,
    couponDiscount: couponDiscount,
    comboDiscount: combo.discount,
    combos: combo.combos,
    shipping: shipping,
    tax: 0,
    total: total
  };
}

// pure: dựng snapshot từng line + subtotal + check tồn kho.
function computeOrderLines(
  itemsData: Item[],
  orderLines: { itemId: string, quantity: number }[],
  heldQuantities: Map<string, number>
): { lines: CalculateOrderResult["lines"], subtotal: number } {
  const itemsMap = new Map(itemsData.map((item) => [item.id, item]));

  const lines: CalculateOrderResult["lines"] = [];
  let subtotal = 0;
  for (const line of orderLines) {
    const item = itemsMap.get(line.itemId);
    if (!item) {
      throw new HTTPException(404, { message: "Item not found" });
    }

    const availableStock = item.stock + (heldQuantities.get(item.id) ?? 0);
    if (line.quantity > availableStock) {
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

    lines.push({
      itemId: item.id,
      productId: item.product?.id ?? null,
      snapItem: snapItem,
      unitPrice: item.price,
      quantity: line.quantity,
      subtotal: lineSubtotal
    });
  }

  return { lines: lines, subtotal: subtotal };
}
