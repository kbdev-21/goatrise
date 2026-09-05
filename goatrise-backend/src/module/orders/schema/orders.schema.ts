import { bigint, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customers } from "../../customers/schema/customers.schema.js";
import { coupons } from "../../promotion/schema/coupons.schema.js";
import type { Address, SalesChannel } from "../../../core/types.js";

export const orders = pgTable.withRLS("orders", {
  id: uuid("id").primaryKey(),
  code: text("code").unique().notNull(),
  platformOrderId: text("platform_order_id"),

  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhoneNum: text("customer_phone_num"),
  customerAddress: jsonb("customer_address").$type<Address>(),

  couponId: uuid("coupon_id").references(() => coupons.id),
  combos: jsonb("combos").$type<OrderCombo[]>().notNull().default([]),

  subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),

  manualDiscountAmount: bigint("manual_discount_amount", { mode: "number" }).default(0).notNull(),
  couponDiscountAmount: bigint("coupon_discount_amount", { mode: "number" }).default(0).notNull(),
  comboDiscountAmount: bigint("combo_discount_amount", { mode: "number" }).default(0).notNull(),
  
  shippingAmount: bigint("shipping_amount", { mode: "number" }).default(0).notNull(),
  taxAmount: bigint("tax_amount", { mode: "number" }).default(0).notNull(),

  totalAmount: bigint("total_amount", { mode: "number" }).notNull(),

  status: text("status").$type<OrderStatus>().default("PENDING").notNull(),
  deliveryStatus: text("delivery_status").$type<OrderDeliveryStatus>().default("PENDING").notNull(),
  paymentStatus: text("payment_status").$type<OrderPaymentStatus>().default("UNPAID").notNull(),
  paymentMethod: text("payment_method").$type<OrderPaymentMethod>().notNull(),

  channel: text("channel").$type<SalesChannel>().notNull(),
  referrerId: uuid("referrer_id"),
  creatorId: uuid("creator_id"),

  note: text("note"),

  platformCost: bigint("platform_cost", { mode: "number" }).default(0).notNull(),
  taxCost: bigint("tax_cost", { mode: "number" }).default(0).notNull(),
  shippingCost: bigint("shipping_cost", { mode: "number" }).default(0).notNull(),
  otherCost: bigint("other_cost", { mode: "number" }).default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()).notNull(),
}, (t) => [
  index().on(t.customerId),
  index().on(t.couponId),
]);

export type OrderCombo = {
  id: string,
  code: string,
  discountAmount: number
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type OrderDeliveryStatus = "PENDING" | "SHIPPING" | "DELIVERED" | "RETURNED";
export type OrderPaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type OrderPaymentMethod = "COD" | "MANUAL_TRANSFER" | "MOMO" | "VNPAY" | "STRIPE";
