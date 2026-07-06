import { integer, pgTable, text, timestamp, uuid, bigint, jsonb, index } from "drizzle-orm/pg-core";
import { products } from "../../catalog/schema/products.schema.js";

export const items = pgTable("items", {
  id: uuid("id").primaryKey(),
  productId: uuid("product_id").references(() => products.id),

  sku: text("sku").unique().notNull(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  imgUrl: text("img_url"),
  attributeValues: jsonb("attribute_values").$type<ItemAttributeValues>().notNull().default({}),

  price: bigint("price", { mode: "number" }).notNull(),
  weight: integer("weight"),

  stock: integer("stock").default(0).notNull(),
  sold: integer("sold").default(0).notNull(),
  status: text("status").$type<ItemStatus>().default("ACTIVE").notNull(),
  note: text("note"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  index().on(t.productId),
]);

export type ItemStatus = "ACTIVE" | "INACTIVE";

export type ItemAttribute = "COLOR" | "SIZE";
export type ItemAttributeValues = {
  COLOR?: {
    hex: string, // key
    enText: string,
    viText: string 
  },
  SIZE?: string
}