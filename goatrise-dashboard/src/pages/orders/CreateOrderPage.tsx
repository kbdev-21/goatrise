import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCalculateOrder, useCreateOrder } from "@/api/order/query-hooks.ts";
import type {
  CreateOrderRequest,
  OrderCalculationResult,
  OrderLineRequest,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
} from "@/api/order/api.ts";
import type { SalesChannel } from "@/core/types.ts";
import { useItems } from "@/api/item/query-hooks.ts";
import type { Item } from "@/api/item/api.ts";
import { formatPriceVn, normalizeVietnameseString } from "@/core/utils.ts";
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
import { COUNTRIES } from "@/constant/countries.ts";

const PAYMENT_METHOD_OPTIONS: { label: string; value: OrderPaymentMethod }[] = [
  { label: "COD", value: "COD" },
  { label: "Manual transfer", value: "MANUAL_TRANSFER" },
  { label: "MoMo", value: "MOMO" },
  { label: "VNPAY", value: "VNPAY" },
  { label: "Stripe", value: "STRIPE" },
];

const PAYMENT_STATUS_OPTIONS: { label: string; value: OrderPaymentStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Shipping", value: "SHIPPING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const CHANNEL_OPTIONS: { label: string; value: SalesChannel }[] = [
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Website", value: "WEBSITE" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "TikTok", value: "TIKTOK" },
  { label: "Zalo", value: "ZALO" },
  { label: "Shopee", value: "SHOPEE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Other", value: "OTHER" },
];

const COUNTRY_CODES = Object.keys(COUNTRIES);

type OrderLineState = { itemId: string; quantity: number };

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const createOrderMutation = useCreateOrder();
  const calculateMutation = useCalculateOrder();
  const itemsQuery = useItems();
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  // ----- customer -----
  const [customerName, setCustomerName] = useState("");
  const [customerPhoneNum, setCustomerPhoneNum] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [address, setAddress] = useState("");
  const [countryCode, setCountryCode] = useState("VN");
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [provinceName, setProvinceName] = useState("");

  // provinces của country đang chọn (undefined nếu country ko có dữ liệu tỉnh/thành)
  const provinces = (
    COUNTRIES[countryCode as keyof typeof COUNTRIES] as {
      provinces?: Record<string, string>;
    }
  ).provinces;

  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    // reset province vì danh sách khác nhau theo từng country
    setProvinceCode(null);
    setProvinceName("");
  };

  const handleProvinceChange = (code: string) => {
    setProvinceCode(code);
    setProvinceName(provinces?.[code] ?? "");
  };

  // ----- lines -----
  const [lines, setLines] = useState<OrderLineState[]>([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

  // ----- pricing inputs (committed on Enter/blur -> trigger recalculation) -----
  const [couponInput, setCouponInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [shippingInput, setShippingInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState<number | undefined>(undefined);
  const [shipping, setShipping] = useState<number | undefined>(undefined);

  // ----- fulfillment / payment (right panel) -----
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>("COD");
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatus>("PENDING");
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [channel, setChannel] = useState<SalesChannel>("INSTAGRAM");
  const [note, setNote] = useState("");

  const [calculation, setCalculation] = useState<OrderCalculationResult | null>(null);

  // gọi calculate mỗi khi lines đổi hoặc pricing input được commit
  const linesKey = JSON.stringify(lines);
  useEffect(() => {
    if (lines.length === 0) {
      setCalculation(null);
      return;
    }
    calculateMutation.mutate(
      {
        lines: lines,
        customerPhoneNum: customerPhoneNum.trim() || undefined,
        couponCode: coupon || undefined,
        manualDiscountAmount: discount,
        manualShippingFee: shipping,
      },
      {
        onSuccess: (result) => setCalculation(result),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, coupon, discount, shipping]);

  const selectedItemIds = lines.map((line) => line.itemId);

  const addItem = (itemId: string) => {
    setLines((prev) =>
      prev.some((line) => line.itemId === itemId)
        ? prev
        : [...prev, { itemId: itemId, quantity: 1 }],
    );
  };
  const removeItem = (itemId: string) =>
    setLines((prev) => prev.filter((line) => line.itemId !== itemId));
  const setQuantity = (itemId: string, quantity: number) =>
    setLines((prev) =>
      prev.map((line) =>
        line.itemId === itemId ? { ...line, quantity: Math.max(1, quantity) } : line,
      ),
    );

  const commitCoupon = () => setCoupon(couponInput.trim());
  const commitDiscount = () =>
    setDiscount(discountInput.trim() ? Math.max(0, Number(discountInput)) : undefined);
  const commitShipping = () =>
    setShipping(shippingInput.trim() ? Math.max(0, Number(shippingInput)) : undefined);

  const canSave =
    customerName.trim().length > 0 &&
    customerPhoneNum.trim().length > 0 &&
    address.trim().length > 0 &&
    countryCode.length > 0 &&
    (provinces ? provinceCode !== null : true) &&
    lines.length > 0;

  function handleSave() {
    const request: CreateOrderRequest = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhoneNum: customerPhoneNum.trim(),
      customerAddress: {
        countryCode: countryCode,
        provinceCode: provinceCode,
        provinceName: provinceName.trim(),
        address: address.trim(),
      },
      couponCode: coupon.trim() || undefined,
      manualDiscountAmount: discount,
      manualShippingFee: shipping,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      status: status,
      channel: channel,
      note: note.trim() || undefined,
      lines: lines.map((line): OrderLineRequest => ({
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

  // ưu tiên message thật từ backend (vd "Coupon not applicable" / "Coupon not found")
  const calcErrorMessage =
    isAxiosError(calculateMutation.error) &&
    typeof calculateMutation.error.response?.data === "string"
      ? calculateMutation.error.response.data
      : "Failed to calculate order.";

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

      <div className="flex items-start gap-4">
        {/* ----- left ----- */}
        <div className="flex flex-1 flex-col gap-4">
          {/* customer info */}
          <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
            <h2 className="text-base font-medium">Customer</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Name</FieldLabel>
                <Input
                  placeholder="e.g. Nguyen Van A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Phone</FieldLabel>
                <Input
                  placeholder="0xxxxxxxxx"
                  value={customerPhoneNum}
                  onChange={(e) => setCustomerPhoneNum(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                placeholder="name@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Address</FieldLabel>
              <Input
                placeholder="Street, ward, district..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Country</FieldLabel>
                <CountryCombobox value={countryCode} onChange={handleCountryChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel required={!!provinces}>Province</FieldLabel>
                {provinces ? (
                  <ProvinceCombobox
                    provinces={provinces}
                    value={provinceCode}
                    onChange={handleProvinceChange}
                  />
                ) : (
                  <Input
                    placeholder="e.g. Ho Chi Minh"
                    value={provinceName}
                    onChange={(e) => setProvinceName(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* items + pricing */}
          <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Items</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItemDialogOpen(true)}
              >
                <Plus className="size-4" />
                Add item
              </Button>
            </div>

            {lines.length === 0 ? (
              <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
                No items yet. Add at least one item to create an order.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lines.map((line) => {
                  const item = items.find((it) => it.id === line.itemId);
                  return (
                    <div
                      key={line.itemId}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {item?.name ?? "Unknown item"}
                          </span>
                          <span className="text-muted-foreground shrink-0 font-mono text-xs">
                            {item?.sku}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {formatPriceVn(item?.price)} × {line.quantity}
                        </span>
                        {item && <ItemAttributeBadges item={item} />}
                      </div>

                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.itemId, Number(e.target.value))}
                        className="w-20"
                      />

                      <span className="w-28 shrink-0 text-right text-sm font-medium">
                        {formatPriceVn((item?.price ?? 0) * line.quantity)}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove item"
                        onClick={() => removeItem(line.itemId)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* pricing inputs */}
            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Coupon code</FieldLabel>
                <Input
                  placeholder="e.g. SALE10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onBlur={commitCoupon}
                  onKeyDown={(e) => e.key === "Enter" && commitCoupon()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Manual discount</FieldLabel>
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
                <FieldLabel>Shipping fee</FieldLabel>
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

            {/* summary (từ kết quả calculate) */}
            <div className="flex flex-col gap-1.5 border-t pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium">Summary</h2>
                {calculateMutation.isPending && (
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <Spinner className="size-3" />
                    calculating...
                  </span>
                )}
              </div>

              {calculateMutation.isError ? (
                <span className="text-destructive text-sm">{calcErrorMessage}</span>
              ) : !calculation ? (
                <span className="text-muted-foreground text-sm">
                  Add items to see the order total.
                </span>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <SummaryRow label="Subtotal" value={calculation.subtotal} />
                  {calculation.manualDiscount > 0 && (
                    <SummaryRow label="Manual discount" value={-calculation.manualDiscount} tone="discount" />
                  )}
                  {calculation.couponDiscount > 0 && (
                    <SummaryRow label="Coupon discount" value={-calculation.couponDiscount} tone="discount" />
                  )}
                  {calculation.combos.map((combo) => (
                    <SummaryRow
                      key={combo.id}
                      label={`Combo · ${combo.name.vi}`}
                      value={-combo.discountAmount}
                      tone="discount"
                    />
                  ))}
                  <SummaryRow label="Shipping" value={calculation.shipping} />
                  <SummaryRow label="Tax" value={calculation.tax} />
                  <div className="mt-1.5 flex items-center justify-between border-t pt-1.5">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-base font-semibold">
                      {formatPriceVn(calculation.total)} VND
                    </span>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      disabled={!canSave || createOrderMutation.isPending}
                      onClick={handleSave}
                    >
                      {createOrderMutation.isPending ? <Spinner /> : <></>}
                      Create order
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ----- right ----- */}
        <div className="bg-card flex w-96 shrink-0 flex-col gap-4 rounded-md border p-6">
          <h2 className="text-base font-medium">Fulfillment</h2>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Payment method</FieldLabel>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as OrderPaymentMethod)}
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
            <FieldLabel>Payment status</FieldLabel>
            <Select
              value={paymentStatus}
              onValueChange={(v) => setPaymentStatus(v as OrderPaymentStatus)}
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
            <FieldLabel>Status</FieldLabel>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
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

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Channel</FieldLabel>
            <Select value={channel} onValueChange={(v) => setChannel(v as SalesChannel)}>
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
            <FieldLabel>Note</FieldLabel>
            <Textarea
              placeholder="Internal note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AddItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        items={items}
        selectedIds={selectedItemIds}
        onAdd={addItem}
      />
    </div>
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
                <ItemAttributeBadges item={item} />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ItemAttributeBadges({ item }: { item: Item }) {
  const color = item.attributeValues?.COLOR;
  const size = item.attributeValues?.SIZE;

  if (!color && !size) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {color && (
        <span className="bg-muted flex items-center gap-1 rounded px-1.5 py-0.5 text-xs">
          <span
            className="size-3 rounded-full border"
            style={{ backgroundColor: color.hex }}
          />
          {color.enText}
        </span>
      )}
      {size && (
        <span className="bg-muted rounded px-1.5 py-0.5 text-xs">Size {size}</span>
      )}
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

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium">
      {children}{" "}
      {required ? (
        <span className="text-destructive">*</span>
      ) : (
        <span className="text-muted-foreground text-xs font-normal">(optional)</span>
      )}
    </label>
  );
}
