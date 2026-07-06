import { bigint, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const itemTransactions = pgTable("item_transactions", {
  id: uuid("id").primaryKey(),
  itemId: uuid("item_id").notNull(),
  itemName: text("item_name").notNull(),
  itemSku: text("item_sku").notNull(),
  actorId: uuid("actor_id"),
  supplierId: uuid("supplier_id"),
  supplierName: text("supplier_name"),
  type: text("type").$type<ItemTransactionType>().notNull(),
  note: text("note"),

  quantity: integer("quantity").notNull(),
  importUnitCost: bigint("import_unit_cost", { mode: "number" }),
  soldUnitPrice: bigint("sold_unit_price", { mode: "number" }),

  createdAt: timestamp("created_at").defaultNow().notNull()
}, (t) => [
  index().on(t.itemId),
  index().on(t.supplierId)
]);

export type ItemTransactionType = "IMPORT" | "ADJUST" | "SOLD";