import { index, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { LanguageString } from "../../../core/types.js";
import type { ItemAttribute } from "../../inventory/schema/items.schema.js";

export const products = pgTable("products", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(),

  title: jsonb("title").$type<LanguageString>().notNull(),
  shortDescription: jsonb("short_description").$type<LanguageString>().notNull(),
  markdownDescription: jsonb("markdown_description").$type<LanguageString>(),
  imgUrls: jsonb("img_urls").$type<string[]>(),
  displayPrice: numeric("display_price", { precision: 15, scale: 2 }),
  comparePrice: numeric("compare_price", { precision: 15, scale: 2 }),

  status: text("status").$type<ProductStatus>().notNull().default("ACTIVE"),
  requiredAttributes: jsonb("required_attributes").$type<ItemAttribute[]>().notNull(),

  sold: integer("sold").default(0).notNull(), 

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type ProductStatus = "ACTIVE" | "INACTIVE";