import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCalculateOrder, useCreateOrder } from "@/api/order/query-hooks.ts";
import type {
  CreateOrderRequest,
  OrderCalculationResult,
  OrderLineRequest,
} from "@/api/order/api.ts";
import { useItems } from "@/api/item/query-hooks.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import OrderInfoForm, {
  EMPTY_ORDER_INFO_FORM_VALUE,
  type OrderInfoFormValue,
  type OrderSummary,
} from "./OrderInfoForm.tsx";

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const createOrderMutation = useCreateOrder();
  const calculateMutation = useCalculateOrder();
  const itemsQuery = useItems();
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const [value, setValue] = useState<OrderInfoFormValue>(EMPTY_ORDER_INFO_FORM_VALUE);
  const [calculation, setCalculation] = useState<OrderCalculationResult | null>(null);

  // gọi calculate mỗi khi lines đổi hoặc pricing được commit
  const linesKey = JSON.stringify(
    value.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
  );
  useEffect(() => {
    if (value.lines.length === 0) {
      setCalculation(null);
      return;
    }
    calculateMutation.mutate(
      {
        lines: value.lines.map((line): OrderLineRequest => ({
          itemId: line.itemId,
          quantity: line.quantity,
        })),
        customerPhoneNum: value.customerPhoneNum.trim() || undefined,
        couponCode: value.couponCode || undefined,
        manualDiscountAmount: value.manualDiscount ? Number(value.manualDiscount) : undefined,
        manualShippingFee: value.manualShipping ? Number(value.manualShipping) : undefined,
      },
      {
        onSuccess: (result) => setCalculation(result),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, value.couponCode, value.manualDiscount, value.manualShipping]);

  // admin: Phone/Address được phép để trống -> chỉ cần tên khách + ít nhất 1 item
  const canSave =
    value.customerName.trim().length > 0 &&
    value.lines.length > 0;

  const summary: OrderSummary | null = calculation
    ? {
        subtotal: calculation.subtotal,
        manualDiscount: calculation.manualDiscount,
        couponDiscount: calculation.couponDiscount,
        couponCode: value.couponCode || null,
        combos: calculation.combos,
        shipping: calculation.shipping,
        tax: calculation.tax,
        total: calculation.total,
      }
    : null;

  // ưu tiên message thật từ backend (vd "Coupon not applicable" / "Coupon not found")
  const calcErrorMessage = calculateMutation.isError
    ? isAxiosError(calculateMutation.error) &&
      typeof calculateMutation.error.response?.data === "string"
      ? calculateMutation.error.response.data
      : "Failed to calculate order."
    : null;

  function handleSave() {
    const request: CreateOrderRequest = {
      customerName: value.customerName.trim(),
      customerEmail: value.customerEmail.trim() || undefined,
      customerPhoneNum: value.customerPhoneNum.trim() || undefined,
      customerAddress: value.address.trim()
        ? {
            countryCode: value.countryCode,
            provinceCode: value.provinceCode,
            provinceName: value.provinceName.trim(),
            address: value.address.trim(),
          }
        : undefined,
      couponCode: value.couponCode.trim() || undefined,
      manualDiscountAmount: value.manualDiscount ? Number(value.manualDiscount) : undefined,
      manualShippingFee: value.manualShipping ? Number(value.manualShipping) : undefined,
      paymentMethod: value.paymentMethod,
      paymentStatus: value.paymentStatus,
      status: value.status,
      channel: value.channel,
      note: value.note.trim() || undefined,
      createdAt: value.createdAt ? new Date(value.createdAt).toISOString() : undefined,
      lines: value.lines.map((line): OrderLineRequest => ({
        itemId: line.itemId,
        quantity: line.quantity,
      })),
    };

    createOrderMutation.mutate(request, {
      onSuccess: () => {
        toast.success("Created order successfully!");
        navigate("/orders");
      },
      onError: (error) => {
        toast.error(
          isAxiosError(error) && typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to create order",
        );
      },
    });
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
        <h1 className="text-2xl font-medium">New Order</h1>

        <Button
          type="button"
          className="ml-auto"
          disabled={!canSave || createOrderMutation.isPending}
          onClick={handleSave}
        >
          {createOrderMutation.isPending ? <Spinner /> : <Save className="size-4" />}
          Save
        </Button>
      </div>

      <OrderInfoForm
        mode="create"
        value={value}
        onChange={setValue}
        items={items}
        summary={summary}
        summaryState={{ calculating: calculateMutation.isPending, error: calcErrorMessage }}
      />
    </div>
  );
}
