import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const productGroupParts = pgTable("product_group_parts", {
  id: uuid("id").primaryKey(),
  groupId: uuid("group_id").notNull(),
  productId: uuid("product_id").notNull(),
  name: text("name").notNull()
}, (t) => [
  index().on(t.groupId),
  index().on(t.productId)
]);