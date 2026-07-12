import { bigint, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Address } from "../../../core/types.js";

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey(),
  email: text("email").unique(),
  phoneNum: text("phone_num"),

  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  socialMedias: jsonb("social_medias").$type<{ platform: CustomerSocialMedia, info: string }[]>().notNull().default([]),
  addresses: jsonb("addresses").$type<Address[]>().default([]).notNull(),

  totalOrders: integer("total_orders").default(0).notNull(),
  totalSpent: bigint("total_spent", { mode: "number" }).default(0).notNull(),
  loyaltyPoints: integer("loyalty_points").default(0).notNull(),

  note: text("note"),
  source: text("source").$type<CustomerSource>().default("OTHER").notNull(),
  lastOrderAt: timestamp("last_order_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  index().on(t.phoneNum)
]);

export type CustomerSocialMedia = "INSTAGRAM" | "FACEBOOK" | "ZALO" | "TIKTOK";
export type CustomerSource = CustomerSocialMedia | "WEBSITE" | "ADMIN" | "OTHER";