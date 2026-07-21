import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useOrder, useUpdateOrder } from "@/api/order/query-hooks.ts";
import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  UpdateOrderRequest,
} from "@/api/order/api.ts";
import type { Address, SalesChannel } from "@/core/types.ts";
import { COUNTRIES } from "@/constant/countries.ts";
import { formatPriceVn } from "@/core/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Shipping", value: "SHIPPING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PAYMENT_STATUS_OPTIONS: { label: string; value: OrderPaymentStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

const PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> = {
  COD: "COD",
  MANUAL_TRANSFER: "Manual transfer",
  MOMO: "MoMo",
  VNPAY: "VNPAY",
  STRIPE: "Stripe",
};

const CHANNEL_LABELS: Record<SalesChannel, string> = {
  WEBSITE: "Website",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  ZALO: "Zalo",
  SHOPEE: "Shopee",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderQuery = useOrder(id ?? "");
  const updateMutation = useUpdateOrder();

  const order = orderQuery.data;

  // chỉ 3 field này được update; còn lại chỉ hiển thị (disabled)
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatus>("PENDING");
  const [note, setNote] = useState("");

  // seed form từ order khi load xong
  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
      setNote(order.note ?? "");
    }
  }, [order]);

  // rule backend: đơn đã COMPLETED thì không đổi được status lẫn paymentStatus (note vẫn được)
  const isLocked = order?.status === "COMPLETED";
  const completingWithoutPaid = status === "COMPLETED" && paymentStatus !== "PAID";
  const isDirty =
    !!order &&
    (status !== order.status ||
      paymentStatus !== order.paymentStatus ||
      note.trim() !== (order.note ?? ""));
  const canSave = !!order && isDirty && !completingWithoutPaid;

  function handleSave() {
    if (!id || !order) return;
    const request: UpdateOrderRequest = {
      status: status,
      paymentStatus: paymentStatus,
      note: note.trim() || undefined,
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
      ) : !order ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="flex items-start gap-4">
          {/* ----- left ----- */}
          <div className="flex flex-1 flex-col gap-4">
            {/* customer (read-only) */}
            <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
              <h2 className="text-base font-medium">Customer</h2>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Name">
                  <Input disabled value={order.customerName} />
                </Field>
                <Field label="Phone">
                  <Input disabled value={order.customerPhoneNum} />
                </Field>
              </div>
              <Field label="Email">
                <Input disabled value={order.customerEmail ?? "—"} />
              </Field>
              <Field label="Address">
                <Input disabled value={formatAddress(order.customerAddress)} />
              </Field>
            </div>

            {/* items + pricing (read-only) */}
            <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
              <h2 className="text-base font-medium">Items</h2>

              <div className="flex flex-col gap-2">
                {order.lines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {line.snapItem.name}
                        </span>
                        <span className="text-muted-foreground shrink-0 font-mono text-xs">
                          {line.snapItem.sku}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatPriceVn(line.unitPrice)} × {line.quantity}
                      </span>
                    </div>
                    <span className="w-28 shrink-0 text-right text-sm font-medium">
                      {formatPriceVn(line.subtotalAmount)}
                    </span>
                  </div>
                ))}
              </div>

              {/* summary */}
              <div className="flex flex-col gap-1.5 border-t pt-4">
                <SummaryRow label="Subtotal" value={order.subtotalAmount} />
                {order.manualDiscountAmount > 0 && (
                  <SummaryRow
                    label="Manual discount"
                    value={-order.manualDiscountAmount}
                    tone="discount"
                  />
                )}
                {order.couponDiscountAmount > 0 && (
                  <SummaryRow
                    label={order.coupon ? `Coupon · ${order.coupon.code}` : "Coupon discount"}
                    value={-order.couponDiscountAmount}
                    tone="discount"
                  />
                )}
                {order.combos.map((combo) => (
                  <SummaryRow
                    key={combo.id}
                    label={`Combo · ${combo.name.vi}`}
                    value={-combo.discountAmount}
                    tone="discount"
                  />
                ))}
                <SummaryRow label="Shipping" value={order.shippingAmount} />
                <SummaryRow label="Tax" value={order.taxAmount} />
                <div className="mt-1.5 flex items-center justify-between border-t pt-1.5">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-base font-semibold">
                    {formatPriceVn(order.totalAmount)} VND
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ----- right ----- */}
          <div className="bg-card flex w-96 shrink-0 flex-col gap-4 rounded-md border p-6">
            <h2 className="text-base font-medium">Fulfillment</h2>

            <Field label="Order code">
              <Input disabled value={order.code} className="font-mono" />
            </Field>

            {/* editable: status */}
            <Field label="Status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as OrderStatus)}
                disabled={isLocked}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* editable: payment status */}
            <Field label="Payment status">
              <Select
                value={paymentStatus}
                onValueChange={(v) => setPaymentStatus(v as OrderPaymentStatus)}
                disabled={isLocked}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {isLocked && (
              <span className="text-muted-foreground text-xs">
                Completed order: status and payment can no longer be changed.
              </span>
            )}
            {completingWithoutPaid && (
              <span className="text-destructive text-xs">
                Payment must be Paid to complete the order.
              </span>
            )}

            <Field label="Payment method">
              <Input disabled value={PAYMENT_METHOD_LABELS[order.paymentMethod]} />
            </Field>
            <Field label="Channel">
              <Input disabled value={CHANNEL_LABELS[order.channel]} />
            </Field>

            {/* editable: note */}
            <Field label="Note">
              <Textarea
                placeholder="Internal note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <Field label="Created">
                <Input disabled value={formatDateTime(order.createdAt)} />
              </Field>
              <Field label="Updated">
                <Input disabled value={formatDateTime(order.updatedAt)} />
              </Field>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "discount";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          tone === "discount"
            ? "font-medium text-emerald-600 dark:text-emerald-400"
            : "text-foreground"
        }
      >
        {formatPriceVn(value)}
      </span>
    </div>
  );
}

function formatAddress(address: Address): string {
  const country =
    COUNTRIES[address.countryCode as keyof typeof COUNTRIES]?.viName ?? address.countryCode;
  return [address.address, address.provinceName, country].filter(Boolean).join(", ");
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB");
}
