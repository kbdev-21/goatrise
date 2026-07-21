import type { DbExec } from "../../../core/db.js";
import type { Combo } from "./types.js";

export type AppliedCombo = {
  id: string,
  code: string,
  discountAmount: number
};

export type ComboCalculationResult = {
  combos: AppliedCombo[],
  discount: number
};

// tính combo discount cho 1 order: fetch all combo active, lọc combo thỏa andConditions,
// cộng dồn discount. trả về snapshot các combo đã áp + tổng discount (chưa cap ở subtotal).
export async function calculateComboDiscount(
  db: DbExec,
  subtotal: number,
  lines: { itemId: string, quantity: number }[]
): Promise<ComboCalculationResult> {
  const combos = await db.query.combos.findMany({
    where: {
      isActive: true
    }
  });

  const quantityByTarget = await buildTargetQuantities(db, lines);

  const applied: AppliedCombo[] = [];
  let discount = 0;
  for (const combo of combos) {
    if (!isComboSatisfied(combo, quantityByTarget)) {
      continue;
    }

    // trả về đúng số tiền lẽ ra được giảm; cap để total không âm do calculateOrder lo
    const comboDiscount = computeComboDiscount(combo, subtotal);
    applied.push({ id: combo.id, code: combo.code, discountAmount: comboDiscount });
    discount = discount + comboDiscount;
  }

  return { combos: applied, discount: discount };
}

export function computeComboDiscount(combo: Combo, subtotal: number): number {
  return combo.discountType === "PERCENTAGE"
    ? Math.floor((subtotal * combo.discountValue) / 100)
    : combo.discountValue;
}

// gom số lượng order theo từng target (ITEM/PRODUCT/COLLECTION) để check điều kiện combo.
async function buildTargetQuantities(db: DbExec, lines: { itemId: string, quantity: number }[]): Promise<Map<string, number>> {
  const items = await db.query.items.findMany({
    where: {
      id: { in: lines.map((line) => line.itemId) }
    }
  });
  const itemById = new Map(items.map((item) => [item.id, item]));

  // product -> danh sách collection chứa nó
  const productIds = [...new Set(items.flatMap((item) => item.productId ? [item.productId] : []))];
  const collectionLinks = productIds.length > 0
    ? await db.query.collectionProducts.findMany({ where: { productId: { in: productIds } } })
    : [];
  const collectionsByProduct = new Map<string, string[]>();
  for (const link of collectionLinks) {
    collectionsByProduct.set(link.productId, [...(collectionsByProduct.get(link.productId) ?? []), link.collectionId]);
  }

  const quantityByTarget = new Map<string, number>();
  const add = (key: string, quantity: number) => quantityByTarget.set(key, (quantityByTarget.get(key) ?? 0) + quantity);

  for (const line of lines) {
    const item = itemById.get(line.itemId);
    if (!item) {
      continue;
    }

    add(`ITEM:${item.id}`, line.quantity);
    if (item.productId) {
      add(`PRODUCT:${item.productId}`, line.quantity);
      for (const collectionId of collectionsByProduct.get(item.productId) ?? []) {
        add(`COLLECTION:${collectionId}`, line.quantity);
      }
    }
  }

  return quantityByTarget;
}

// combo thỏa khi MỌI điều kiện (AND) đều đủ số lượng target trong order.
function isComboSatisfied(combo: Combo, quantityByTarget: Map<string, number>): boolean {
  return combo.andConditions.every((cond) =>
    (quantityByTarget.get(`${cond.targetType}:${cond.targetId}`) ?? 0) >= cond.quantity
  );
}
