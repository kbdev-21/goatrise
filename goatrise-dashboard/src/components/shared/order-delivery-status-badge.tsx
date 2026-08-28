import { capitalize } from "@/core/utils.ts";
import { Badge } from "@/components/shared/badge.tsx";
import type { OrderDeliveryStatus } from "@/api/order/api.ts";

const ORDER_DELIVERY_STATUS_CLASS: Record<OrderDeliveryStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SHIPPING: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  RETURNED: "bg-muted text-muted-foreground",
};

export function OrderDeliveryStatusBadge({ status }: { status: OrderDeliveryStatus }) {
  return <Badge label={capitalize(status)} className={ORDER_DELIVERY_STATUS_CLASS[status]} />;
}
