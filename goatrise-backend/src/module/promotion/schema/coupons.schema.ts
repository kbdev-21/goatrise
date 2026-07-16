import { bigint, boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey(),
  code: text("code").unique().notNull(),

  discountType: text("discount_type").$type<CouponDiscountType>().notNull(),
  discountValue: bigint("discount_value", { mode: "number" }).notNull(), // PERCENTAGE: discountValue là phần trăm nguyên (vd 10 = 10%)

  minAppliablePrice: bigint("min_appliable_price", { mode: "number" }).default(0).notNull(),
  maxDiscountAmount: bigint("max_discount_amount", { mode: "number" }), // null = không giới hạn (chủ yếu cho PERCENTAGE)

  maximalUsage: integer("maximal_usage").default(1).notNull(),
  usedCount: integer("used_count").default(0).notNull(),
  usedPhoneNums: jsonb("used_phone_nums").$type<string[]>().default([]).notNull(),

  isActive: boolean("is_active").default(true).notNull(),
  isOutOfUse: boolean("is_out_of_use").default(false).notNull(),
  startsAt: timestamp("starts_at").defaultNow().notNull(), // default = có hiệu lực ngay
  expiresAt: timestamp("expires_at"), // null = không hết hạn

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type CouponDiscountType = "FIXED" | "PERCENTAGE";
