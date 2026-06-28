import { db } from "../../../core/db.js";

const baseItemQuery = db.query.items.findFirst();
export type Item = NonNullable<Awaited<typeof baseItemQuery>>;

const baseSupplierQuery = db.query.suppliers.findFirst();
export type Supplier = NonNullable<Awaited<typeof baseSupplierQuery>>;

export const ITEM_TRANSACTIONS_RELATIONS = {
  item: true,
  actor: true,
  supplier: true
};
const baseItemTransactionQuery = db.query.itemTransactions.findFirst({
  with: ITEM_TRANSACTIONS_RELATIONS
});
export type ItemTransaction = NonNullable<Awaited<typeof baseItemTransactionQuery>>;