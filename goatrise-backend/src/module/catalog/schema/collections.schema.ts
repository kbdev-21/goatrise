import { type AnyPgColumn, bigint, boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { LanguageString } from "../../../core/types.js";

export const collections = pgTable.withRLS("collections", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(), // should be english

  parentId: uuid("parent_id").references((): AnyPgColumn => collections.id),

  type: text("type").$type<CollectionType>().notNull(),
  title: jsonb("title").$type<LanguageString>().notNull(),
  shortDescription: jsonb("short_description").$type<LanguageString>().notNull(),
  imgUrl: text("img_url"),

  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  displayPriority: integer("display_priority").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  index().on(t.parentId),
]);

export type CollectionType = "COLLECTION" | "CATEGORY" | "EVENT";