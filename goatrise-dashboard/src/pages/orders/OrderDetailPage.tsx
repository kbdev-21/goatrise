import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useOrder, useUpdateOrder } from "@/api/order/query-hooks.ts";
import type { Order, UpdateOrderRequest } from "@/api/order/api.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import OrderInfoForm, {
  type OrderInfoFormValue,
  type OrderSummary,
} from "./OrderInfoForm.tsx";

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderQuery = useOrder(id ?? "");
  const updateMutation = useUpdateOrder();

  const order = orderQuery.data;

  const [value, setValue] = useState<OrderInfoFormValue | null>(null);

  // seed form từ order khi load xong
  useEffect(() => {
    if (order) {
      setValue(orderToFormValue(order));
    }
  }, [order]);

  const isDirty =
    !!value &&
    !!order &&
    JSON.stringify(value) !== JSON.stringify(orderToFormValue(order));
  const completingWithoutPaid =
    !!value && value.status === "COMPLETED" && value.paymentStatus !== "PAID";
  // không cho lưu nếu người dùng xóa trắng ngày tạo
  const canSave = !!value && isDirty && !completingWithoutPaid && value.createdAt !== "";
  const locked = order?.status === "COMPLETED";

  const summary: OrderSummary | null = order
    ? {
        subtotal: order.subtotalAmount,
        manualDiscount: order.manualDiscountAmount,
        couponDiscount: order.couponDiscountAmount,
        couponCode: order.coupon?.code ?? null,
        combos: order.combos,
        shipping: order.shippingAmount,
        tax: order.taxAmount,
        total: order.totalAmount,
      }
    : null;

  function handleSave() {
    if (!id || !order || !value) return;
    // chỉ gửi createdAt khi đổi -> tránh cắt precision xuống phút khi giữ nguyên
    const createdAtChanged = value.createdAt !== toDateTimeLocalValue(order.createdAt);
    const request: UpdateOrderRequest = {
      status: value.status,
      paymentStatus: value.paymentStatus,
      note: value.note.trim() || undefined,
      createdAt: createdAtChanged ? new Date(value.createdAt).toISOString() : undefined,
    };
    updateMutation.mutate(
      { orderId: id, request },
      {
        onSuccess: () => {
          toast.success(`Updated order ${order.code}`);
          navigate("/orders");
        },
        onError: (error) => {
          toast.error(
            isAxiosError(error) && typeof error.response?.data === "string"
              ? error.response.data
              : "Failed to update order",
          );
        },
      },
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => navigate("/orders")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-medium">Order Detail</h1>

        <Button
          type="button"
          className="ml-auto"
          disabled={!canSave || updateMutation.isPending}
          onClick={handleSave}
        >
          {updateMutation.isPending ? <Spinner /> : <Save className="size-4" />}
          Save
        </Button>
      </div>

      {orderQuery.isError ? (
        <div className="bg-card text-destructive rounded-md border p-6 text-sm">
          Failed to load order.
        </div>
      ) : !value || !order ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <OrderInfoForm
          mode="edit"
          value={value}
          onChange={setValue}
          items={[]}
          summary={summary}
          orderCode={order.code}
          locked={locked}
        />
      )}
    </div>
  );
}

function orderToFormValue(order: Order): OrderInfoFormValue {
  return {
    customerName: order.customerName,
    customerPhoneNum: order.customerPhoneNum ?? "",
    customerEmail: order.customerEmail ?? "",
    address: order.customerAddress?.address ?? "",
    countryCode: order.customerAddress?.countryCode ?? "VN",
    provinceCode: order.customerAddress?.provinceCode ?? null,
    provinceName: order.customerAddress?.provinceName ?? "",
    lines: order.lines.map((line) => ({
      itemId: line.itemId ?? "",
      quantity: line.quantity,
      name: line.snapItem.name,
      sku: line.snapItem.sku,
      unitPrice: line.unitPrice,
      attributeValues: line.snapItem.attributeValues,
    })),
    couponCode: order.coupon?.code ?? "",
    manualDiscount: order.manualDiscountAmount ? String(order.manualDiscountAmount) : "",
    manualShipping: order.shippingAmount ? String(order.shippingAmount) : "",
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    channel: order.channel,
    note: order.note ?? "",
    createdAt: toDateTimeLocalValue(order.createdAt),
  };
}

// ISO string -> "YYYY-MM-DDTHH:mm" theo giờ local (định dạng input datetime-local yêu cầu)
function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
