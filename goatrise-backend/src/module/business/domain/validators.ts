import z from "zod";

const OrderLineSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().positive()
});

export const CalculateOrderRequestSchema = z.object({
  customerEmail: z.email().optional(),
  customerAddress: z.string().trim().min(1).optional(),
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
  customerAddress: z.string().trim().min(1),

  couponCode: z.string().trim().min(1).optional(),
  
  manualDiscountAmount: z.number().int().nonnegative().optional(),
  manualShippingFee: z.number().int().nonnegative().optional(),

  paymentMethod: z.enum(["COD", "MANUAL_TRANSFER", "MOMO", "VNPAY", "STRIPE"]),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  status: z.enum(["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"]).optional(),

  channel: z.enum(["WEBSITE", "INSTAGRAM", "FACEBOOK", "TIKTOK", "SHOPEE", "OTHER"]),
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
