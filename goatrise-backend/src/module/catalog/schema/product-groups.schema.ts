import { pgTable, uuid } from "drizzle-orm/pg-core";

export const productGroups = pgTable("product_groups", {
  id: uuid("id").primaryKey()
});