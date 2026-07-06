import axiosInstance from "@/api/axios-instance.ts";
import type { ItemAttributeValues } from "@/api/item/api.ts";
import type { LanguageString } from "@/core/types.ts";

export async function findOrders(params?: FindOrdersParams): Promise<Order[]> {
  const res = await axiosInstance.get<Order[]>("/api/orders", { params });
  return res.data;
}

export async function calculateOrder(request: CalculateOrderRequest): Promise<OrderCalculationResult> {
  const res = await axiosInstance.post<OrderCalculationResult>("/api/orders/calculate", request);
  return res.data;
}

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  const res = await axiosInstance.post<Order>("/api/orders", request);
  return res.data;
}

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPING" | "COMPLETED" | "CANCELLED";

export type OrderPaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type OrderPaymentMethod = "COD" | "MANUAL_TRANSFER" | "MOMO" | "VNPAY" | "STRIPE";

export type OrderChannel = "WEBSITE" | "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "SHOPEE" | "OTHER";

// Mirror backend: module/business/schema/order-lines.schema.ts -> OrderLineSnapItem
export type OrderLineSnapItem = {
  sku: string;
  name: string;
  imgUrl: string | null;
  attributeValues: ItemAttributeValues;
  price: number;
  product: {
    slug: string;
    title: LanguageString;
    imgUrls: string[] | null;
  } | null;
};

// Mirror backend: module/business/schema/order-lines.schema.ts (bigint serialized as number)
export type OrderLine = {
  id: string;
  orderId: string;
  itemId: string | null;
  productId: string | null;
  snapItem: OrderLineSnapItem;
  quantity: number;
  unitPrice: number;
  subtotalAmount: number;
  createdAt: string;
  updatedAt: string;
};

// Mirror backend: module/business/domain/types.ts -> Order (ORDER_RELATIONS)
// bigint columns serialized as number; timestamps serialized as ISO string
export type Order = {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string | null;
  customerPhoneNum: string;
  customerAddress: string;
  couponCode: string | null;
  subtotalAmount: number;
  manualDiscountAmount: number;
  couponDiscountAmount: number;
  comboDiscountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  channel: OrderChannel;
  referrerId: string | null;
  creatorId: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lines: OrderLine[];
};

export type FindOrdersParams = {
  search?: string;
  channel?: OrderChannel;
  status?: OrderStatus;
  sort?: string;
  offset?: number;
  limit?: number;
};

export type OrderLineRequest = {
  itemId: string;
  quantity: number;
};

// Mirror backend: module/business/domain/validators.ts -> CreateOrderRequestSchema
export type CreateOrderRequest = {
  customerName: string;
  customerEmail?: string;
  customerPhoneNum: string;
  customerAddress: string;
  couponCode?: string;
  manualDiscountAmount?: number;
  manualShippingFee?: number;
  paymentMethod: OrderPaymentMethod;
  paymentStatus?: OrderPaymentStatus;
  status?: OrderStatus;
  channel: OrderChannel;
  referrerId?: string;
  note?: string;
  lines: OrderLineRequest[];
};

// Mirror backend: module/business/domain/validators.ts -> CalculateOrderRequestSchema
export type CalculateOrderRequest = {
  customerEmail?: string;
  customerAddress?: string;
  couponCode?: string;
  paymentMethod?: OrderPaymentMethod;
  manualDiscountAmount?: number;
  manualShippingFee?: number;
  lines: OrderLineRequest[];
};

// Mirror backend: module/business/domain/order-calculation.service.ts -> OrderCalculationResult
export type OrderCalculationResult = {
  lines: {
    itemId: string;
    productId: string | null;
    snapItem: OrderLineSnapItem;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  manualDiscount: number;
  couponDiscount: number;
  comboDiscount: number;
  shipping: number;
  tax: number;
  total: number;
};
