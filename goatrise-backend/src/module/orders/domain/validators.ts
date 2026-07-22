import z from "zod";
import type { OrderStatus, OrderPaymentStatus } from "../schema/orders.schema.js";
import type { SalesChannel } from "../../../core/types.js";

const orderChannels = ["WEBSITE", "INSTAGRAM", "FACEBOOK", "TIKTOK", "SHOPEE", "REFERRAL", "OTHER"] satisfies SalesChannel[];
const orderStatuses = ["PENDING", "SHIPPING", "COMPLETED", "CANCELLED"] satisfies OrderStatus[];
const orderPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"] satisfies OrderPaymentStatus[];

const OrderLineSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().positive()
});

const AddressSchema = z.object({
  countryCode: z.string(),
  provinceCode: z.string().nullable(),
  provinceName: z.string(),
  address: z.string()
});

export const CalculateOrderRequestSchema = z.object({
  customerPhoneNum: z.string().trim().min(1).max(20).optional(),
  customerAddress: AddressSchema.optional(),
  couponCode: z.string().trim().min(1).optional(),
  paymentMethod: z.enum(["COD", "MANUAL_TRANSFER", "MOMO", "VNPAY", "STRIPE"]).optional(),
  manualDiscountAmount: z.number().int().nonnegative().optional(),
  manualShippingFee: z.number().int().nonnegative().optional(),
  lines: z
    .array(OrderLineSchema)
    .min(1)
    .refine((arr) => new Set(arr.map((l) => l.itemId)).size === arr.length, {
      message: "lines must not contain duplicate itemIds"
    })
});
export type CalculateOrderRequest = z.infer<typeof CalculateOrderRequestSchema>;

export const CreateOrderRequestSchema = z.object({
  customerName: z.string().trim().min(1).max(100),
  customerEmail: z.email().optional(),
  customerPhoneNum: z.string().trim().min(1).max(20),
  customerAddress: AddressSchema,

  couponCode: z.string().trim().min(1).optional(),

  manualDiscountAmount: z.number().int().nonnegative().optional(),
  manualShippingFee: z.number().int().nonnegative().optional(),

  paymentMethod: z.enum(["COD", "MANUAL_TRANSFER", "MOMO", "VNPAY", "STRIPE"]),
  paymentStatus: z.enum(orderPaymentStatuses).optional(),
  status: z.enum(orderStatuses).optional(),

  channel: z.enum(orderChannels),
  referrerId: z.uuid().optional(),

  note: z.string().trim().min(1).optional(),

  lines: z
    .array(OrderLineSchema)
    .min(1)
    .refine((arr) => new Set(arr.map((l) => l.itemId)).size === arr.length, {
      message: "lines must not contain duplicate itemIds"
    })
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// đơn khách tự đặt (storefront): bỏ các field vốn do admin set
export const PlaceOrderRequestSchema = CreateOrderRequestSchema.omit({
  manualDiscountAmount: true,
  manualShippingFee: true,
  paymentStatus: true,
  status: true,
  channel: true,
  referrerId: true
});
export type PlaceOrderRequest = z.infer<typeof PlaceOrderRequestSchema>;

export const FindOrdersQuerySchema = z.object({
  search: z.string().optional(),
  channel: z.enum(orderChannels).optional(),
  status: z.enum(orderStatuses).optional(),
  sort: z.string().default("createdAt:DESC"),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().default(20)
});
export type FindOrdersQuery = z.infer<typeof FindOrdersQuerySchema>;

export const UpdateOrderRequestSchema = z.object({
  paymentStatus: z.enum(orderPaymentStatuses).optional(),
  status: z.enum(orderStatuses).optional(),
  note: z.string().trim().min(1).optional()
});
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;
