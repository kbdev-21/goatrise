import { bigint, boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { LanguageString } from "../../../core/types.js";

export const combos = pgTable("combos", {
  id: uuid("id").primaryKey(),
  name: jsonb("name").$type<LanguageString>().notNull(),

  andConditions: jsonb("and_conditions").$type<ComboCondition[]>().notNull(),

  discountType: text("discount_type").$type<ComboDiscountType>().notNull(),
  discountValue: bigint("discount_value", { mode: "number" }).notNull(), // PERCENTAGE: discountValue là phần trăm nguyên (vd 10 = 10%)

  usedCount: integer("used_count").default(0).notNull(),

  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type ComboDiscountType = "FIXED" | "PERCENTAGE";
export type ComboCondition = {
  targetType: "ITEM" | "PRODUCT" | "COLLECTION",
  targetId: string,
  quantity: number
}