import { HTTPException } from "hono/http-exception";
import type { DbExec } from "../../../core/db.js";
import { ITEM_TRANSACTIONS_RELATIONS, type ItemTransaction } from "./types.js";
import type { ItemTransactionType } from "../schema/item-transactions.schema.js";

export async function getItemTransactionById(db: DbExec, id: string): Promise<ItemTransaction> {
  const transaction = await db.query.itemTransactions.findFirst({
    where: {
      id: id
    },
    with: ITEM_TRANSACTIONS_RELATIONS
  });

  if(!transaction) {
    throw new HTTPException(404, { message: "Item transaction not found" });
  }

  return transaction;
}

export async function findItemTransactions(
  db: DbExec,
  itemId?: string,
  type?: ItemTransactionType,
  offset: number = 0,
  limit: number = 20
): Promise<ItemTransaction[]> {
  return await db.query.itemTransactions.findMany({
    where: {
      ...(itemId ? { itemId: itemId } : {}),
      ...(type ? { type: type } : {})
    },
    with: ITEM_TRANSACTIONS_RELATIONS,
    offset: offset,
    limit: limit,
    orderBy: { createdAt: "desc" }
  });
}