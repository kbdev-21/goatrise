import { bigint, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull().unique(),
  slug: text("slug").notNull().unique(),
  shortDescription: text("short_description"),
  markdownDescription: text("markdown_description"),
  imgUrls: jsonb("img_urls").$type<string[]>(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";