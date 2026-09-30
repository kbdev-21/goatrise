import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  useCalculateOrderUpdate,
  useOrder,
  useUpdateOrder,
} from "@/api/order/query-hooks.ts";
import type {
  Order,
  OrderCalculationResult,
  OrderLineRequest,
  UpdateOrderRequest,
} from "@/api/order/api.ts";
import { useItems } from "@/api/item/query-hooks.ts";
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
  // endpoint preview theo đơn: đơn CONFIRMED được cộng lại stock nó đang giữ khi check tồn kho
  const calculateMutation = useCalculateOrderUpdate();
  const itemsQuery = useItems();
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  const order = orderQuery.data;
  // rule duy nhất còn lại của backend: đơn CONFIRMED mà có coupon thì cấm đổi khối tiền
  // (revert + confirm lại sẽ chạm applyCoupon lần hai) lẫn phone (usedPhoneNums giữ phone cũ
  // -> chủ mới hưởng giảm giá mà không bị ghi nhận). Field khác sửa được ở mọi status.
  const couponLocked = order?.status === "CONFIRMED" && order?.couponId !== null;

  const [value, setValue] = useState<OrderInfoFormValue | null>(null);
  const [calculation, setCalculation] = useState<OrderCalculationResult | null>(null);
  // khối tiền mặc định chỉ xem snapshot; bấm Edit mới cho sửa + live-calculate
  const [pricingEditing, setPricingEditing] = useState(false);

  const initialValue = useMemo(() => (order ? orderToFormValue(order) : null), [order]);

  // seed form từ order khi load xong
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  // đang edit VÀ khối tiền thật sự khác snapshot -> mới gửi pricing khi save
  const pricingDirty =
    pricingEditing &&
    !!value &&
    !!initialValue &&
    pricingKey(value) !== pricingKey(initialValue);

  // live-calculate chỉ khi đang edit khối tiền: lines/coupon/discount/shipping đổi -> tính lại
  const linesKey = value
    ? JSON.stringify(value.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })))
    : "";
  useEffect(() => {
    if (!id || !value || couponLocked || !pricingEditing || value.lines.length === 0) {
      setCalculation(null);
      return;
    }
    calculateMutation.mutate(
      {
        orderId: id,
        request: {
          lines: value.lines.map((line): OrderLineRequest => ({
            itemId: line.itemId,
            quantity: line.quantity,
          })),
          customerPhoneNum: value.customerPhoneNum.trim() || undefined,
          couponCode: value.couponCode || undefined,
          manualDiscountAmount: value.manualDiscount ? Number(value.manualDiscount) : undefined,
          manualShippingFee: value.manualShipping ? Number(value.manualShipping) : undefined,
        },
      },
      {
        onSuccess: (result) => setCalculation(result),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    linesKey,
    value?.couponCode,
    value?.manualDiscount,
    value?.manualShipping,
    couponLocked,
    pricingEditing,
  ]);

  // Cancel: trả khối tiền về snapshot (giữ nguyên các field khác đang sửa) rồi về chế độ xem
  function handleCancelPricing() {
    if (!value || !initialValue) return;
    setValue({
      ...value,
      lines: initialValue.lines,
      couponCode: initialValue.couponCode,
      manualDiscount: initialValue.manualDiscount,
      manualShipping: initialValue.manualShipping,
    });
    setPricingEditing(false);
  }

  const isDirty =
    !!value &&
    !!order &&
    JSON.stringify(value) !== JSON.stringify(orderToFormValue(order));
  // bắt buộc còn tên khách + ít nhất 1 item (giống create)
  const hasRequiredFields =
    !!value && value.customerName.trim().length > 0 && value.lines.length > 0;
  // không cho lưu nếu người dùng xóa trắng ngày tạo
  const canSave = !!value && isDirty && hasRequiredFields && value.createdAt !== "";

  // summary: chế độ xem (hoặc bị khóa) dùng số đã lưu; đang edit dùng kết quả calculate live
  // (fallback số đã lưu trong lúc chờ lần calculate đầu)
  const storedSummary: OrderSummary | null = order
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
  const liveSummary: OrderSummary | null = calculation
    ? {
        subtotal: calculation.subtotal,
        manualDiscount: calculation.manualDiscount,
        couponDiscount: calculation.couponDiscount,
        couponCode: value?.couponCode || null,
        combos: calculation.combos,
        shipping: calculation.shipping,
        tax: calculation.tax,
        total: calculation.total,
      }
    : null;
  const summary: OrderSummary | null = !pricingEditing
    ? storedSummary
    : value?.lines.length
      ? (liveSummary ?? storedSummary)
      : null;

  // message thật từ backend khi calculate lỗi (vd coupon/stock)
  const calcErrorMessage = calculateMutation.isError
    ? isAxiosError(calculateMutation.error) &&
      typeof calculateMutation.error.response?.data === "string"
      ? calculateMutation.error.response.data
      : "Failed to calculate order."
    : null;

  function handleSave() {
    if (!id || !order || !value) return;
    // chỉ gửi createdAt khi đổi -> tránh cắt precision xuống phút khi giữ nguyên
    const createdAtChanged = value.createdAt !== toDateTimeLocalValue(order.createdAt);
    const createdAt = createdAtChanged ? new Date(value.createdAt).toISOString() : undefined;

    // backend coi field khối tiền CÓ MẶT (kể cả giá trị không đổi) là pricingChanged -> tính lại
    // theo giá hiện tại. Nên chỉ gửi 4 field đó khi pricingDirty (couponLocked thì không vào
    // được edit nên pricingDirty luôn false). undefined = giữ nguyên, null = xóa field nullable.
    const request: UpdateOrderRequest = {
      customerName: value.customerName.trim(),
      customerEmail: value.customerEmail.trim() || null,
      customerPhoneNum: couponLocked ? undefined : value.customerPhoneNum.trim() || null,
      customerAddress: value.address.trim()
        ? {
            countryCode: value.countryCode,
            provinceCode: value.provinceCode,
            provinceName: value.provinceName.trim(),
            address: value.address.trim(),
          }
        : null,
      paymentMethod: value.paymentMethod,
      paymentStatus: value.paymentStatus,
      status: value.status,
      deliveryStatus: value.deliveryStatus,
      channel: value.channel,
      platformOrderId: value.platformOrderId.trim() || null,
      note: value.note.trim() || undefined,
      createdAt: createdAt,
      ...(!pricingDirty
        ? {}
        : {
            couponCode: value.couponCode.trim() || null,
            // form là nguồn sự thật cho pricing -> gửi 0 khi trống (không để backend giữ giá trị cũ)
            manualDiscountAmount: value.manualDiscount ? Number(value.manualDiscount) : 0,
            manualShippingFee: value.manualShipping ? Number(value.manualShipping) : 0,
            lines: value.lines.map((line): OrderLineRequest => ({
              itemId: line.itemId,
              quantity: line.quantity,
            })),
          }),
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
          items={items}
          summary={summary}
          summaryState={
            pricingEditing
              ? { calculating: calculateMutation.isPending, error: calcErrorMessage }
              : undefined
          }
          orderCode={order.code}
          couponLocked={couponLocked}
          pricingEdit={{
            editing: pricingEditing,
            onEdit: () => setPricingEditing(true),
            onCancel: handleCancelPricing,
          }}
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
      imgUrl: line.snapItem.imgUrl,
      unitPrice: line.unitPrice,
      attributeValues: line.snapItem.attributeValues,
    })),
    couponCode: order.coupon?.code ?? "",
    manualDiscount: order.manualDiscountAmount ? String(order.manualDiscountAmount) : "",
    manualShipping: order.shippingAmount ? String(order.shippingAmount) : "",
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    deliveryStatus: order.deliveryStatus,
    channel: order.channel,
    platformOrderId: order.platformOrderId ?? "",
    note: order.note ?? "",
    createdAt: toDateTimeLocalValue(order.createdAt),
  };
}

// key so sánh khối tiền; chuẩn hóa số để "0" và "" (trống) coi như nhau
function pricingKey(value: OrderInfoFormValue): string {
  return JSON.stringify({
    lines: value.lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
    couponCode: value.couponCode.trim(),
    manualDiscount: Number(value.manualDiscount || 0),
    manualShipping: Number(value.manualShipping || 0),
  });
}

// ISO string -> "YYYY-MM-DDTHH:mm" theo giờ local (định dạng input datetime-local yêu cầu)
function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
