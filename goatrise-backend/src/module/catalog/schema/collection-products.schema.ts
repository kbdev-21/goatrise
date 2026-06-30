import { boolean, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { collections } from "./collections.schema.js";
import { products } from "./products.schema.js";

export const collectionProducts = pgTable("collection_products", {
  id: uuid("id").primaryKey(),
  collectionId: uuid("collection_id").references(() => collections.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),

  isFeatured: boolean("is_featured").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  index().on(t.collectionId),
  index().on(t.productId),
]);