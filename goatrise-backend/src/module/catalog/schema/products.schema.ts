import { bigint, boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { LanguageString } from "../../../core/types.js";
import type { ItemAttribute } from "../../inventory/schema/items.schema.js";

export const products = pgTable("products", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(),

  title: jsonb("title").$type<LanguageString>().notNull(),
  shortDescription: jsonb("short_description").$type<LanguageString>().notNull(),
  markdownDescription: jsonb("markdown_description").$type<LanguageString>(),
  imgUrls: jsonb("img_urls").$type<string[]>(),
  displayPrice: bigint("display_price", { mode: "number" }),
  comparePrice: bigint("compare_price", { mode: "number" }),

  isActive: boolean("is_active").notNull().default(true),
  requiredAttributes: jsonb("required_attributes").$type<ItemAttribute[]>().notNull(),

  sold: integer("sold").default(0).notNull(), 

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});