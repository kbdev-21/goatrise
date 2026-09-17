import type { ItemDb } from "../../db/schema/items.schema.js";
import type { ItemTransactionDb } from "../../db/schema/item-transactions.schema.js";
import type { SupplierDb } from "../../db/schema/suppliers.schema.js";
import type { ProductDb } from "../../db/schema/products.schema.js";
import type { UserDb } from "../../db/schema/users.schema.js";

export type Item = ItemDb & {
  product: ProductDb | null
};
export const ITEM_RELATIONS = {
  product: true
};

export type ItemTransaction = ItemTransactionDb & {
  actor: UserDb | null
};
export const ITEM_TRANSACTIONS_RELATIONS = {
  actor: true
};

export type Supplier = SupplierDb;
