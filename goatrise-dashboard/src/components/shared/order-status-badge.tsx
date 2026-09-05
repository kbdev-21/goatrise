import { capitalize } from "@/core/utils.ts";
import { Badge } from "@/components/shared/badge.tsx";
import type { OrderStatus } from "@/api/order/api.ts";

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge label={capitalize(status)} className={ORDER_STATUS_CLASS[status]} />;
}
