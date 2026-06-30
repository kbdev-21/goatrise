import { bigint, index, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { LanguageString } from "../../../core/types.js";

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull().unique(), // should be english

  type: text("type").$type<CollectionType>().notNull(),
  title: jsonb("title").$type<LanguageString>().notNull(),
  shortDescription: jsonb("short_description").$type<LanguageString>().notNull(),
  imgUrl: text("img_url"),

  status: text("status").$type<CollectionStatus>().notNull().default("ACTIVE"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type CollectionType = "COLLECTION" | "CATEGORY" | "EVENT";
export type CollectionStatus = "ACTIVE" | "INACTIVE";