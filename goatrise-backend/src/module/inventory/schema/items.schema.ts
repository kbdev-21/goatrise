import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: uuid("id").primaryKey(),
  sku: text("sku").unique().notNull(),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  
  note: text("note"),
  imgUrl: text("img_url"),
  status: text("status").$type<ItemStatus>().default("ACTIVE").notNull(),
  weight: integer("weight"),

  quantity: integer("quantity").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type ItemStatus = "ACTIVE" | "INACTIVE";
