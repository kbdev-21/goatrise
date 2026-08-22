import z from "zod";
import type { OrderStatus, OrderPaymentStatus } from "../schema/orders.schema.js";
import type { SalesChannel } from "../../../core/types.js";

const orderChannels = ["WEBSITE", "INSTAGRAM", "FACEBOOK", "TIKTOK", "SHOPEE", "REFERRAL", "OTHER"] satisfies SalesChannel[];
const orderStatuses = ["PENDING", "SHIPPING", "DELIVERED", "COMPLETED", "CANCELLED"] satisfies OrderStatus[];
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
  customerPhoneNum: z.string().trim().min(1).max(20).optional(),
  customerAddress: AddressSchema.optional(),

  couponCode: z.string().trim().min(1).optional(),

  manualDiscountAmount: z.number().int().nonnegative().optional(),
  manualShippingFee: z.number().int().nonnegative().optional(),

  paymentMethod: z.enum(["COD", "MANUAL_TRANSFER", "MOMO", "VNPAY", "STRIPE"]),
  paymentStatus: z.enum(orderPaymentStatuses).optional(),
  status: z.enum(orderStatuses).optional(),

  channel: z.enum(orderChannels),
  referrerId: z.uuid().optional(),

  note: z.string().trim().min(1).optional(),

  createdAt: z.coerce.date().optional(),

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
  referrerId: true,
  createdAt: true
}).extend({
  // khách tự đặt vẫn bắt buộc có SĐT + địa chỉ (để giao hàng); admin thì được để trống
  customerPhoneNum: z.string().trim().min(1).max(20),
  customerAddress: AddressSchema
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

// update đơn chưa COMPLETED: cho sửa gần như mọi field như lúc create.
// quy ước: field vắng mặt (undefined) = giữ nguyên; field nullable gửi null = xóa về null.
export const UpdateOrderRequestSchema = z.object({
  // customer info: chỉ ghi đè snapshot trên order, KHÔNG re-resolve customerId
  // (đổi tên/email/phone ở đây không hồi tố bảng customers).
  customerName: z.string().trim().min(1).max(100).optional(),
  customerEmail: z.email().nullable().optional(),
  customerPhoneNum: z.string().trim().min(1).max(20).nullable().optional(),
  customerAddress: AddressSchema.nullable().optional(),

  // money inputs: có mặt bất kỳ field nào -> tính lại nguyên khối qua calculateOrder
  couponCode: z.string().trim().min(1).nullable().optional(),
  manualDiscountAmount: z.number().int().nonnegative().optional(),
  manualShippingFee: z.number().int().nonnegative().optional(),
  lines: z
    .array(OrderLineSchema)
    .min(1)
    .refine((arr) => new Set(arr.map((l) => l.itemId)).size === arr.length, {
      message: "lines must not contain duplicate itemIds"
    })
    .optional(),

  paymentMethod: z.enum(["COD", "MANUAL_TRANSFER", "MOMO", "VNPAY", "STRIPE"]).optional(),
  paymentStatus: z.enum(orderPaymentStatuses).optional(),
  status: z.enum(orderStatuses).optional(),

  channel: z.enum(orderChannels).optional(),
  referrerId: z.uuid().nullable().optional(),

  note: z.string().trim().min(1).optional(),
  createdAt: z.coerce.date().optional()
});
export type UpdateOrderRequest = z.infer<typeof UpdateOrderRequestSchema>;
