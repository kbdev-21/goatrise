import { HTTPException } from "hono/http-exception";
import type { DbExec } from "../../../core/db.js";
import type { CalculateOrderRequest } from "./validators.js";
import type { OrderLineSnapItem } from "../schema/order-lines.schema.js";

export type OrderCalculationResult = {
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

export async function calculateOrder(db: DbExec, req: CalculateOrderRequest): Promise<OrderCalculationResult> {
  const itemIds = req.lines.map((line) => line.itemId);
  const foundItems = await db.query.items.findMany({
    columns: {
      id: true,
      sku: true,
      name: true,
      imgUrl: true,
      attributeValues: true,
      price: true
    },
    with: {
      product: {
        columns: {
          id: true,
          slug: true,
          title: true,
          imgUrls: true
        }
      }
    },
    where: {
      id: {
        in: itemIds
      }
    }
  });

  const itemsMap = new Map(foundItems.map((item) => [item.id, item]));

  const resultLines = [];
  let subtotal = 0;
  for(const line of req.lines) {
    const item = itemsMap.get(line.itemId);
    if(!item) {
      throw new HTTPException(404, { message: "Item not found" });
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

  const manualDiscount = req.manualDiscountAmount ?? 0;
  const shipping = req.manualShippingFee ?? 0;
  const total = Math.max(subtotal - manualDiscount + shipping , 0);

  return {
    lines: resultLines,
    subtotal: subtotal,
    manualDiscount: manualDiscount,
    couponDiscount: 0,
    comboDiscount: 0,
    shipping: shipping,
    tax: 0,
    total: total
  };
}
