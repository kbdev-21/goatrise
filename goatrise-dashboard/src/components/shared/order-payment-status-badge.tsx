import { capitalize } from "@/core/utils.ts";
import { Badge } from "@/components/shared/badge.tsx";
import type { OrderPaymentStatus } from "@/api/order/api.ts";

const ORDER_PAYMENT_STATUS_CLASS: Record<OrderPaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-muted text-muted-foreground",
};

export function OrderPaymentStatusBadge({ status }: { status: OrderPaymentStatus }) {
  return <Badge label={capitalize(status)} className={ORDER_PAYMENT_STATUS_CLASS[status]} />;
}
