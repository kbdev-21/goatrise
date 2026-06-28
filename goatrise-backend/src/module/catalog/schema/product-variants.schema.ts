import { integer, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey(),
  productId: uuid("product_id").notNull(),
  priceChange: numeric("price_change", { precision: 15, scale: 2 }).notNull(),
  stock: integer("stock").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});