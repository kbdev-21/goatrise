import type { DbExec } from "../../../core/db.js";
import { items } from "../schema/items.schema.js";
import { itemTransactions } from "../schema/item-transactions.schema.js";
import { HTTPException } from "hono/http-exception";
import { eq, sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { recordAuditLog } from "../../audit/domain/audit-logs.service.js";
import { getItemById } from "./items.service.js";
import { getSupplierById } from "./suppliers.service.js";
import type { AdjustItemStockRequest, ImportItemRequest } from "./validators.js";
import type { Item } from "./types.js";

export async function importItem(db: DbExec, actorId: string, itemId: string, importReq: ImportItemRequest): Promise<Item> {
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
