import { bigint, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Address } from "../../../core/types.js";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  code: text("code").unique().notNull(),

  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhoneNum: text("customer_phone_num").notNull(),
  customerAddress: jsonb("customer_address").$type<Address>().notNull(),

  couponCode: text("coupon_code"),

  subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),

  manualDiscountAmount: bigint("manual_discount_amount", { mode: "number" }).default(0).notNull(),
  couponDiscountAmount: bigint("coupon_discount_amount", { mode: "number" }).default(0).notNull(),
  comboDiscountAmount: bigint("combo_discount_amount", { mode: "number" }).default(0).notNull(),

  shippingAmount: bigint("shipping_amount", { mode: "number" }).default(0).notNull(),
  taxAmount: bigint("tax_amount", { mode: "number" }).default(0).notNull(),

  totalAmount: bigint("total_amount", { mode: "number" }).notNull(),

  paymentMethod: text("payment_method").$type<OrderPaymentMethod>().notNull(),
  paymentStatus: text("payment_status").$type<OrderPaymentStatus>().default("PENDING").notNull(),
  status: text("status").$type<OrderStatus>().default("PENDING").notNull(),

  channel: text("channel").$type<OrderChannel>().notNull(),
  referrerId: uuid("referrer_id"),
  creatorId: uuid("creator_id"),

  note: text("note"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPING" | "COMPLETED" | "CANCELLED";
export type OrderPaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type OrderPaymentMethod = "COD" | "MANUAL_TRANSFER" | "MOMO" | "VNPAY" | "STRIPE";
export type OrderChannel = "WEBSITE" | "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "SHOPEE" | "OTHER";