import { bigint, index, integer, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "./orders.schema.js";
import { items } from "../../inventory/schema/items.schema.js";
import { products } from "../../catalog/schema/products.schema.js";
import type { ItemAttributeValues } from "../../inventory/schema/items.schema.js";
import type { LanguageString } from "../../../core/types.js";

export const orderLines = pgTable("order_lines", {
  id: uuid("id").primaryKey(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),

  itemId: uuid("item_id").notNull(),
  productId: uuid("product_id"),
  snapItem: jsonb("snap_item").$type<OrderLineSnapItem>().notNull(),

  quantity: integer("quantity").notNull(),
  unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
  subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  index().on(t.orderId),
  index().on(t.itemId),
  index().on(t.productId),
]);

export type OrderLineSnapItem = {
  sku: string;
  name: string;
  imgUrl: string | null;
  attributeValues: ItemAttributeValues;
  price: number;
  product: {
    slug: string;
    title: LanguageString;
    imgUrls: string[] | null;
  } | null;
};
