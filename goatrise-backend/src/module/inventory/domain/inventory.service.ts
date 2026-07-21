import type { DbExec } from "../../../core/db.js";
import { items } from "../schema/items.schema.js";
import { itemTransactions } from "../schema/item-transactions.schema.js";
import { products } from "../../catalog/schema/products.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq, sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import { getItemById } from "./items.service.js";
import { getSupplierById } from "./suppliers.service.js";
import type { AdjustItemStockRequest, ImportItemRequest } from "./validators.js";
import type { Item } from "./types.js";

export async function importItemStock(db: DbExec, actorId: string, itemId: string, importReq: ImportItemRequest): Promise<Item> {
  const newTransactionId = uuidv7();

  return await db.transaction(async (tx) => {
    const itemBefore = await getItemById(tx, itemId);
    const supplier = importReq.supplierId ? await getSupplierById(tx, importReq.supplierId) : null;

    await tx.insert(itemTransactions).values({
      id: newTransactionId,
      itemId: itemId,
      itemName: itemBefore.name,
      itemSku: itemBefore.sku,
      actorId: actorId,
      supplierId: importReq.supplierId ?? null,
      supplierName: supplier?.name ?? null,
      type: "IMPORT",
      note: importReq.note ?? null,
      quantity: importReq.quantity,
      importUnitCost: importReq.importUnitCost
    });

    await tx.update(items).set({
      stock: sql`${items.stock} + ${importReq.quantity}`
    }).where(eq(items.id, itemId));

    const itemAfter = await getItemById(tx, itemId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "item-import",
      referenceType: "item",
      referenceId: itemId,
      metadata: {
        before: itemBefore,
        after: itemAfter,
        transactionId: newTransactionId
      }
    });

    return itemAfter;
  });
}

export async function manualAdjustItemStock(db: DbExec, actorId: string, itemId: string, adjustReq: AdjustItemStockRequest): Promise<Item> {
  const newTransactionId = uuidv7();

  return await db.transaction(async (tx) => {
    const itemBefore = await getItemById(tx, itemId);

    if (itemBefore.stock + adjustReq.stockChange < 0) {
      throw new HTTPException(409, { message: "Negative stock not allowed" });
    }

    await tx.insert(itemTransactions).values({
      id: newTransactionId,
      itemId: itemId,
      itemName: itemBefore.name,
      itemSku: itemBefore.sku,
      actorId: actorId,
      type: "ADJUST",
      note: adjustReq.note,
      quantity: adjustReq.stockChange
    });

    await tx.update(items).set({
      stock: sql`${items.stock} + ${adjustReq.stockChange}`
    }).where(eq(items.id, itemId));

    const itemAfter = await getItemById(tx, itemId);

    await recordAuditLog(tx, {
      actorId: actorId,
      code: "item-adjust",
      referenceType: "item",
      referenceId: itemId,
      metadata: {
        before: itemBefore,
        after: itemAfter,
        transactionId: newTransactionId
      }
    });

    return itemAfter;
  });
}

// đánh dấu bán ra cho nhiều item: trừ stock, cộng sold, ghi transaction SOLD.
// batch fetch toàn bộ item liên quan 1 lần ở đầu function.
// tự bọc transaction; khi caller truyền tx (vd createOrder) thì đây là savepoint lồng.
export async function soldItems(db: DbExec, soldList: { itemId: string, quantity: number }[]): Promise<void> {
  const foundItems = await db.query.items.findMany({
    where: {
      id: {
        in: soldList.map((sold) => sold.itemId)
      }
    }
  });
  const itemsMap = new Map(foundItems.map((item) => [item.id, item]));

  await db.transaction(async (tx) => {
    // nhiều item có thể cùng thuộc 1 product (khác size/màu) -> cộng dồn rồi update 1 lần
    const soldByProduct = new Map<string, number>();

    for (const sold of soldList) {
      const item = itemsMap.get(sold.itemId);
      if (!item) {
        throw new HTTPException(404, { message: "Item not found" });
      }

      if (item.stock < sold.quantity) {
        throw new HTTPException(409, { message: `Insufficient stock for item ${item.sku}` });
      }

      await tx.insert(itemTransactions).values({
        id: uuidv7(),
        itemId: sold.itemId,
        itemName: item.name,
        itemSku: item.sku,
        actorId: null,
        type: "SOLD",
        quantity: -sold.quantity,
        soldUnitPrice: item.price
      });

      await tx.update(items).set({
        stock: sql`${items.stock} - ${sold.quantity}`,
        sold: sql`${items.sold} + ${sold.quantity}`
      }).where(eq(items.id, sold.itemId));

      if (item.productId) {
        soldByProduct.set(item.productId, (soldByProduct.get(item.productId) ?? 0) + sold.quantity);
      }
    }

    // item lẻ (productId null) thì bỏ qua
    for (const [productId, quantity] of soldByProduct) {
      await tx.update(products).set({
        sold: sql`${products.sold} + ${quantity}`
      }).where(eq(products.id, productId));
    }
  });
}
