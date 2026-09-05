import { type ReactNode, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type {
  OrderDeliveryStatus,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
} from "@/api/order/api.ts";
import type { Item, ItemAttributeValues } from "@/api/item/api.ts";
import type { SalesChannel } from "@/core/types.ts";
import { COUNTRIES } from "@/constant/countries.ts";
import { formatPriceVn, normalizeVietnameseString } from "@/core/utils.ts";
import { ItemAttributeBadges } from "@/components/shared/item-attribute-badges.tsx";
import { ImageThumbnail } from "@/components/shared/image-thumbnail.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox.tsx";

const PAYMENT_METHOD_OPTIONS: { label: string; value: OrderPaymentMethod }[] = [
  { label: "COD", value: "COD" },
  { label: "Manual transfer", value: "MANUAL_TRANSFER" },
  { label: "MoMo", value: "MOMO" },
  { label: "VNPAY", value: "VNPAY" },
  { label: "Stripe", value: "STRIPE" },
];

const PAYMENT_STATUS_OPTIONS: { label: string; value: OrderPaymentStatus }[] = [
  { label: "Unpaid", value: "UNPAID" },
  { label: "Paid", value: "PAID" },
  { label: "Refunded", value: "REFUNDED" },
];

const DELIVERY_STATUS_OPTIONS: { label: string; value: OrderDeliveryStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Shipping", value: "SHIPPING" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Returned", value: "RETURNED" },
];

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const CHANNEL_OPTIONS: { label: string; value: SalesChannel }[] = [
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Website", value: "WEBSITE" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "TikTok", value: "TIKTOK" },
  { label: "Shopee", value: "SHOPEE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Other", value: "OTHER" },
];

const COUNTRY_CODES = Object.keys(COUNTRIES);

// 1 dòng hàng trong form: mang sẵn info hiển thị để render đồng nhất ở cả create (từ catalog)
// lẫn edit (từ snapItem đã lưu) — không phụ thuộc vào việc item còn tồn tại trong catalog.
export type OrderLineFormValue = {
  itemId: string;
  quantity: number;
  name: string;
  sku: string;
  imgUrl: string | null;
  unitPrice: number;
  attributeValues: ItemAttributeValues;
};

export type OrderInfoFormValue = {
  customerName: string;
  customerPhoneNum: string;
  customerEmail: string;
  address: string;
  countryCode: string;
  provinceCode: string | null;
  provinceName: string;
  lines: OrderLineFormValue[];
  // pricing đã "commit" (dùng để calculate + build request); typing buffer nằm trong form
  couponCode: string;
  manualDiscount: string;
  manualShipping: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  deliveryStatus: OrderDeliveryStatus;
  channel: SalesChannel;
  platformOrderId: string;
  // cost: chi phí shop chịu, KHÔNG tham gia calculateOrder -> giữ dạng string như manualDiscount
  platformCost: string;
  taxCost: string;
  shippingCost: string;
  otherCost: string;
  note: string;
  createdAt: string; // dạng datetime-local ("YYYY-MM-DDTHH:mm"); "" = để backend dùng now()
};

export const EMPTY_ORDER_INFO_FORM_VALUE: OrderInfoFormValue = {
  customerName: "",
  customerPhoneNum: "",
  customerEmail: "",
  address: "",
  countryCode: "VN",
  provinceCode: null,
  provinceName: "",
  lines: [],
  couponCode: "",
  manualDiscount: "",
  manualShipping: "",
  paymentMethod: "COD",
  paymentStatus: "UNPAID",
  status: "PENDING",
  deliveryStatus: "PENDING",
  channel: "INSTAGRAM",
  platformOrderId: "",
  platformCost: "",
  taxCost: "",
  shippingCost: "",
  otherCost: "",
  note: "",
  createdAt: "",
};

// Dữ liệu tổng tiền để render Summary; create map từ calculate, edit map từ order đã lưu.
export type OrderSummary = {
  subtotal: number;
  manualDiscount: number;
  couponDiscount: number;
  couponCode: string | null;
  combos: { id: string; code: string; discountAmount: number }[];
  shipping: number;
  tax: number;
  total: number;
};

export default function OrderInfoForm({
  mode,
  value,
  onChange,
  items,
  summary,
  summaryState,
  orderCode,
  couponLocked = false,
}: {
  mode: "create" | "edit";
  value: OrderInfoFormValue;
  onChange: (value: OrderInfoFormValue) => void;
  items: Item[];
  summary: OrderSummary | null;
  // create: trạng thái live-calculate; edit bỏ trống (summary luôn có sẵn từ order)
  summaryState?: { calculating: boolean; error: string | null };
  orderCode?: string;
  // đơn đã CONFIRMED mà có coupon: backend cấm đổi khối tiền LẪN phone (coupon.usedPhoneNums
  // đã ghi phone cũ) -> khóa items, pricing và phone. Mọi field khác luôn sửa được ở mọi status.
  couponLocked?: boolean;
}) {
  const set = (patch: Partial<OrderInfoFormValue>) => onChange({ ...value, ...patch });

  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  // typing buffer cho pricing (chỉ dùng ở create) -> commit vào value khi blur/Enter
  const [couponInput, setCouponInput] = useState(value.couponCode);
  const [discountInput, setDiscountInput] = useState(value.manualDiscount);
  const [shippingInput, setShippingInput] = useState(value.manualShipping);

  const provinces = (
    COUNTRIES[value.countryCode as keyof typeof COUNTRIES] as {
      provinces?: Record<string, string>;
    }
  ).provinces;

  const handleCountryChange = (code: string) =>
    set({ countryCode: code, provinceCode: null, provinceName: "" });
  const handleProvinceChange = (code: string) =>
    set({ provinceCode: code, provinceName: provinces?.[code] ?? "" });

  const selectedItemIds = value.lines.map((line) => line.itemId);

  const addItem = (itemId: string) => {
    if (value.lines.some((line) => line.itemId === itemId)) return;
    const item = items.find((it) => it.id === itemId);
    if (!item) return;
    set({
      lines: [
        ...value.lines,
        {
          itemId: itemId,
          quantity: 1,
          name: item.name,
          sku: item.sku,
          imgUrl: item.imgUrl,
          unitPrice: item.price,
          attributeValues: item.attributeValues,
        },
      ],
    });
  };
  const removeItem = (itemId: string) =>
    set({ lines: value.lines.filter((line) => line.itemId !== itemId) });
  const setQuantity = (itemId: string, quantity: number) =>
    set({
      lines: value.lines.map((line) =>
        line.itemId === itemId ? { ...line, quantity: Math.max(1, quantity) } : line,
      ),
    });

  const commitCoupon = () => set({ couponCode: couponInput.trim() });
  const commitDiscount = () =>
    set({ manualDiscount: discountInput.trim() ? String(Math.max(0, Number(discountInput))) : "" });
  const commitShipping = () =>
    set({ manualShipping: shippingInput.trim() ? String(Math.max(0, Number(shippingInput))) : "" });

  return (
    <>
      <div className="flex items-start gap-4">
        {/* ----- left ----- */}
        <div className="flex flex-1 flex-col gap-4">
          {/* customer */}
          <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
            <h2 className="text-base font-medium">Customer</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Name</FieldLabel>
                <Input
                  placeholder="e.g. Nguyen Van A"
                  value={value.customerName}
                  onChange={(e) => set({ customerName: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel optional>Phone</FieldLabel>
                <Input
                  placeholder="0xxxxxxxxx"
                  value={value.customerPhoneNum}
                  disabled={couponLocked}
                  onChange={(e) => set({ customerPhoneNum: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel optional>Email</FieldLabel>
              <Input
                type="email"
                placeholder="name@example.com"
                value={value.customerEmail}
                onChange={(e) => set({ customerEmail: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel optional>Address</FieldLabel>
              <Input
                placeholder="Street, ward, district..."
                value={value.address}
                onChange={(e) => set({ address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel optional>Country</FieldLabel>
                <CountryCombobox value={value.countryCode} onChange={handleCountryChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel optional>Province</FieldLabel>
                {provinces ? (
                  <ProvinceCombobox
                    provinces={provinces}
                    value={value.provinceCode}
                    onChange={handleProvinceChange}
                  />
                ) : (
                  <Input
                    placeholder="e.g. Ho Chi Minh"
                    value={value.provinceName}
                    onChange={(e) => set({ provinceName: e.target.value })}
                  />
                )}
              </div>
            </div>
          </div>

          {/* items + pricing + summary */}
          <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Items</h2>
              {!couponLocked && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItemDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  Add item
                </Button>
              )}
            </div>

            {value.lines.length === 0 ? (
              <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                No items yet. Add at least one item to create an order.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {value.lines.map((line) => (
                  <div
                    key={line.itemId}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <ImageThumbnail
                      url={line.imgUrl ?? ""}
                      alt={line.name}
                      className="size-10"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{line.name}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-xs">
                          {line.sku}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatPriceVn(line.unitPrice)} × {line.quantity}
                      </span>
                      <ItemAttributeBadges attributeValues={line.attributeValues} />
                    </div>

                    {!couponLocked && (
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.itemId, Number(e.target.value))}
                        className="w-20"
                      />
                    )}

                    <span className="w-28 shrink-0 text-right text-sm font-medium">
                      {formatPriceVn(line.unitPrice * line.quantity)}
                    </span>

                    {!couponLocked && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove item"
                        onClick={() => removeItem(line.itemId)}
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* pricing inputs (create only) */}
            {!couponLocked && (
              <div className="grid grid-cols-2 gap-3 border-t pt-4">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel optional>Coupon code</FieldLabel>
                  <Input
                    placeholder="e.g. SALE10"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onBlur={commitCoupon}
                    onKeyDown={(e) => e.key === "Enter" && commitCoupon()}
                  />
                  {value.couponCode && !value.customerPhoneNum.trim() && (
                    <span className="text-destructive text-xs">
                      Phone number is required to apply a coupon.
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel optional>Manual discount</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    onBlur={commitDiscount}
                    onKeyDown={(e) => e.key === "Enter" && commitDiscount()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel optional>Shipping fee</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={shippingInput}
                    onChange={(e) => setShippingInput(e.target.value)}
                    onBlur={commitShipping}
                    onKeyDown={(e) => e.key === "Enter" && commitShipping()}
                  />
                </div>
              </div>
            )}

            {/* summary */}
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Summary</h2>
                {summaryState?.calculating && (
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Spinner className="size-3" />
                    calculating...
                  </span>
                )}
              </div>

              {summaryState?.error ? (
                <span className="text-destructive text-sm">{summaryState.error}</span>
              ) : !summary ? (
                <span className="text-muted-foreground text-sm">
                  Add items to see the order total.
                </span>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <SummaryRow label="Subtotal" value={summary.subtotal} />
                  {summary.manualDiscount > 0 && (
                    <SummaryRow
                      label="Manual discount"
                      value={-summary.manualDiscount}
                      tone="discount"
                    />
                  )}
                  {summary.couponDiscount > 0 && (
                    <SummaryRow
                      label={summary.couponCode ? `Coupon · ${summary.couponCode}` : "Coupon discount"}
                      value={-summary.couponDiscount}
                      tone="discount"
                    />
                  )}
                  {summary.combos.map((combo) => (
                    <SummaryRow
                      key={combo.id}
                      label={`Combo · ${combo.code}`}
                      value={-combo.discountAmount}
                      tone="discount"
                    />
                  ))}
                  <SummaryRow label="Shipping" value={summary.shipping} />
                  <SummaryRow label="Tax" value={summary.tax} />
                  <div className="mt-1.5 flex items-center justify-between border-t pt-1.5">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-base font-semibold">
                      {formatPriceVn(summary.total)} VND
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ----- right ----- */}
        <div className="flex w-96 shrink-0 flex-col gap-4">
          <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
            <h2 className="text-base font-medium">Fulfillment</h2>

            {mode === "edit" && orderCode && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Order code</FieldLabel>
                <Input disabled value={orderCode} className="font-mono" />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <FieldLabel optional>Platform order ID</FieldLabel>
              <Input
                placeholder="e.g. 2508XXXXXXXX"
                value={value.platformOrderId}
                className="font-mono"
                onChange={(e) => set({ platformOrderId: e.target.value })}
              />
              <span className="text-muted-foreground text-xs">
                Order ID on the platform (Shopee, TikTok...).
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Channel</FieldLabel>
              <Select
                value={value.channel}
                onValueChange={(v) => set({ channel: v as SalesChannel })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Status</FieldLabel>
              <Select
                value={value.status}
                onValueChange={(v) => set({ status: v as OrderStatus })}
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
            </div>

            {couponLocked && (
              <span className="text-muted-foreground text-xs">
                Confirmed order with a coupon: items, pricing and phone number can no longer be
                changed.
              </span>
            )}

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Payment status</FieldLabel>
              <Select
                value={value.paymentStatus}
                onValueChange={(v) => set({ paymentStatus: v as OrderPaymentStatus })}
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
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Payment method</FieldLabel>
              <Select
                value={value.paymentMethod}
                onValueChange={(v) => set({ paymentMethod: v as OrderPaymentMethod })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Delivery status</FieldLabel>
              <Select
                value={value.deliveryStatus}
                onValueChange={(v) => set({ deliveryStatus: v as OrderDeliveryStatus })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel optional>Note</FieldLabel>
              <Textarea
                placeholder="Internal note..."
                value={value.note}
                onChange={(e) => set({ note: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel optional>Created date</FieldLabel>
              <Input
                type="datetime-local"
                value={value.createdAt}
                onChange={(e) => set({ createdAt: e.target.value })}
              />
              {mode === "create" && (
                <span className="text-muted-foreground text-xs">
                  Leave empty to use the current time.
                </span>
              )}
            </div>
          </div>

          <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
            <h2 className="text-base font-medium">Cost</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel optional>Platform cost</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={value.platformCost}
                  onChange={(e) => set({ platformCost: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel optional>Tax cost</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={value.taxCost}
                  onChange={(e) => set({ taxCost: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel optional>Shipping cost</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={value.shippingCost}
                  onChange={(e) => set({ shippingCost: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel optional>Other cost</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={value.otherCost}
                  onChange={(e) => set({ otherCost: e.target.value })}
                />
              </div>
            </div>

            <span className="text-muted-foreground text-xs">
              Costs the shop absorbs. They do not affect the order total.
            </span>
          </div>
        </div>
      </div>

      {!couponLocked && (
        <AddItemDialog
          open={itemDialogOpen}
          onOpenChange={setItemDialogOpen}
          items={items}
          selectedIds={selectedItemIds}
          onAdd={addItem}
        />
      )}
    </>
  );
}

function AddItemDialog({
  open,
  onOpenChange,
  items,
  selectedIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  selectedIds: string[];
  onAdd: (itemId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const availableItems = items.filter((item) => !selectedIds.includes(item.id));
  const keyword = normalizeVietnameseString(search.trim());
  const filteredItems = keyword
    ? availableItems.filter((item) =>
        normalizeVietnameseString(`${item.name} ${item.sku}`).includes(keyword),
      )
    : availableItems;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            placeholder="Search name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
          <Search className="text-muted-foreground absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
        </div>

        <div className="max-h-96 overflow-auto rounded-md border">
          {filteredItems.length === 0 ? (
            <div className="text-muted-foreground p-3 text-center text-xs">
              No items found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAdd(item.id)}
                className="hover:bg-muted/50 flex w-full flex-col gap-1 border-b px-3 py-2 text-left last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium">{item.name}</span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {item.sku}
                  </span>
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                    {formatPriceVn(item.price)} VND
                  </span>
                </div>
                <ItemAttributeBadges attributeValues={item.attributeValues} />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
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

function CountryCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <Combobox
      items={COUNTRY_CODES}
      value={value}
      onValueChange={(next) => next && onChange(next as string)}
      itemToStringLabel={(code) => COUNTRIES[code as keyof typeof COUNTRIES].viName}
    >
      <ComboboxInput placeholder="Select country..." />
      <ComboboxContent>
        <ComboboxEmpty>No country found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(code: string) => (
              <ComboboxItem key={code} value={code}>
                {COUNTRIES[code as keyof typeof COUNTRIES].viName}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function ProvinceCombobox({
  provinces,
  value,
  onChange,
}: {
  provinces: Record<string, string>;
  value: string | null;
  onChange: (code: string) => void;
}) {
  const codes = Object.keys(provinces);
  return (
    <Combobox
      items={codes}
      value={value}
      onValueChange={(next) => next && onChange(next as string)}
      itemToStringLabel={(code) => provinces[code as string]}
    >
      <ComboboxInput placeholder="Select province..." />
      <ComboboxContent>
        <ComboboxEmpty>No province found.</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(code: string) => (
              <ComboboxItem key={code} value={code}>
                {provinces[code]}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function FieldLabel({
  children,
  required,
  optional,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="text-xs font-medium">
      {children}{" "}
      {required && <span className="text-destructive">*</span>}
      {optional && (
        <span className="text-muted-foreground text-xs font-normal">(optional)</span>
      )}
    </label>
  );
}
