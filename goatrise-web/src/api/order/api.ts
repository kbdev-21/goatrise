import axiosInstance from "@/api/axios-instance";
import type { ItemBase } from "@/api/product/api";

export async function calculateOrder(
  request: CalculateOrderRequest
): Promise<OrderCalculationResult> {
  const res = await axiosInstance.post<OrderCalculationResult>(
    "/api/orders/calculate",
    request
  );
  return res.data;
}

export async function placeOrder(request: PlaceOrderRequest): Promise<Order> {
  const res = await axiosInstance.post<Order>("/api/orders/place", request);
  return res.data;
}

// web tự dùng cho địa chỉ, không phụ thuộc core/types của backend
export type LanguageString = { vi: string; en: string };

export type SalesChannel =
  | "WEBSITE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TIKTOK"
  | "SHOPEE"
  | "REFERRAL"
  | "OTHER";

// Mirror backend: core/types.ts -> Address (validators.ts AddressSchema)
export type Address = {
  countryCode: string;
  provinceCode: string | null;
  provinceName: string;
  address: string;
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
export type OrderDeliveryStatus = "PENDING" | "SHIPPING" | "DELIVERED" | "RETURNED";
export type OrderPaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type OrderPaymentMethod = "COD" | "MANUAL_TRANSFER" | "MOMO" | "VNPAY" | "STRIPE";

// Mirror backend: module/orders/schema/orders.schema.ts -> OrderCombo
export type OrderCombo = {
  id: string;
  code: string;
  discountAmount: number;
};

// Mirror backend: module/orders/schema/order-lines.schema.ts -> OrderLineSnapItem
export type OrderLineSnapItem = {
  sku: string;
  name: string;
  imgUrl: string | null;
  attributeValues: ItemBase["attributeValues"];
  price: number;
  product: {
    slug: string;
    title: LanguageString;
    imgUrls: string[] | null;
  } | null;
};

// Base: cột gốc của order-line (mirror OrderLineBase backend, bigint serialized as number)
export type OrderLineBase = {
  id: string;
  orderId: string;
  itemId: string;
  productId: string | null;
  snapItem: OrderLineSnapItem;
  quantity: number;
  unitPrice: number;
  subtotalAmount: number;
  createdAt: string;
  updatedAt: string;
};

// Mirror backend: module/promotion/schema/coupons.schema.ts -> CouponBase
export type Coupon = {
  id: string;
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  minAppliablePrice: number;
  maxDiscountAmount: number | null;
  maximalUsage: number;
  usedCount: number;
  usedPhoneNums: string[];
  isActive: boolean;
  isOutOfUse: boolean;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Base: cột gốc của order (mirror OrderBase backend)
// bigint columns serialized as number; timestamps serialized as ISO string
export type OrderBase = {
  id: string;
  code: string;
  platformOrderId: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhoneNum: string | null;
  customerAddress: Address | null;
  couponId: string | null;
  combos: OrderCombo[];
  subtotalAmount: number;
  manualDiscountAmount: number;
  couponDiscountAmount: number;
  comboDiscountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: OrderStatus;
  deliveryStatus: OrderDeliveryStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: OrderPaymentMethod;
  channel: SalesChannel;
  referrerId: string | null;
  creatorId: string | null;
  note: string | null;
  platformCost: number;
  taxCost: number;
  shippingCost: number;
  otherCost: number;
  createdAt: string;
  updatedAt: string;
};

// Order + relations (ORDER_RELATIONS)
export type Order = OrderBase & {
  lines: OrderLineBase[];
  coupon: Coupon | null;
};

export type OrderLineRequest = {
  itemId: string;
  quantity: number;
};

// Mirror backend: module/orders/domain/validators.ts -> CalculateOrderRequestSchema
export type CalculateOrderRequest = {
  customerPhoneNum?: string;
  customerAddress?: Address;
  couponCode?: string;
  paymentMethod?: OrderPaymentMethod;
  manualDiscountAmount?: number;
  manualShippingFee?: number;
  lines: OrderLineRequest[];
};

// Mirror backend: module/orders/domain/validators.ts -> PlaceOrderRequestSchema
// đơn khách tự đặt (storefront): channel = WEBSITE do backend gán, SĐT + địa chỉ bắt buộc
export type PlaceOrderRequest = {
  customerName: string;
  customerEmail?: string;
  customerPhoneNum: string;
  customerAddress: Address;
  couponCode?: string;
  paymentMethod: OrderPaymentMethod;
  note?: string;
  lines: OrderLineRequest[];
};

// Mirror backend: module/orders/domain/order-calculation.service.ts -> CalculateOrderResult
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
  combos: OrderCombo[];
  shipping: number;
  tax: number;
  total: number;
};
