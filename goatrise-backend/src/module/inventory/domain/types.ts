import { items } from "../schema/items.schema.js";
import { itemTransactions } from "../schema/item-transactions.schema.js";
import { suppliers } from "../schema/suppliers.schema.js";
import type { ProductBase } from "../../catalog/domain/types.js";
import type { UserBase } from "../../auth/domain/types.js";

export type ItemBase = typeof items.$inferSelect;
export type ItemTransactionBase = typeof itemTransactions.$inferSelect;
export type SupplierBase = typeof suppliers.$inferSelect;

export type Item = ItemBase & {
  product: ProductBase | null
};
export const ITEM_RELATIONS = {
  product: true
};

export type ItemTransaction = ItemTransactionBase & {
  actor: UserBase | null
};
export const ITEM_TRANSACTIONS_RELATIONS = {
  actor: true
};

export type Supplier = SupplierBase;
