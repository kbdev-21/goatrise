import { db } from "../../../core/db.js";

export const ITEM_RELATIONS = {
  product: true
}
const baseItemQuery = db.query.items.findFirst({
  with: ITEM_RELATIONS
});
export type Item = NonNullable<Awaited<typeof baseItemQuery>>;

const baseSupplierQuery = db.query.suppliers.findFirst();
export type Supplier = NonNullable<Awaited<typeof baseSupplierQuery>>;

export const ITEM_TRANSACTIONS_RELATIONS = {
  actor: true
};
const baseItemTransactionQuery = db.query.itemTransactions.findFirst({
  with: ITEM_TRANSACTIONS_RELATIONS
});
export type ItemTransaction = NonNullable<Awaited<typeof baseItemTransactionQuery>>;