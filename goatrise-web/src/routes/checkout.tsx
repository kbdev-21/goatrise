import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { isAxiosError } from "axios";

import { CartLineItem } from "@/components/shared/cart-line-item";
import { COUNTRIES } from "@/constant/countries";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { cn, formatPrice } from "@/lib/utils";
import { selectSubtotal, useCartStore } from "@/stores/cart.store";
import { useCalculateOrder, usePlaceOrder } from "@/api/order/query-hooks";
import type {
  Order,
  OrderLineRequest,
  OrderPaymentMethod,
  PlaceOrderRequest,
} from "@/api/order/api";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

const COUNTRY_ITEMS = Object.entries(COUNTRIES).map(([code, country]) => ({
  value: code,
  label: country.viName,
}));

const PAYMENT_METHODS = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  // tạm thời chỉ hỗ trợ COD
] as const;

function CheckoutPage() {
  const lines = useCartStore((s) => s.lines);
  const subtotal = useCartStore(selectSubtotal);
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  const [countryCode, setCountryCode] = useState<keyof typeof COUNTRIES>("VN");
  const [provinceCode, setProvinceCode] = useState("");

  // chỉ VN có danh sách tỉnh/thành trong COUNTRIES
  const provinces = (
    COUNTRIES[countryCode] as { provinces?: Record<string, string> }
  ).provinces;
  // tạm thời chưa giao ngoài VN
  const isSupportedCountry = countryCode === "VN";

  const clearCart = useCartStore((s) => s.clearCart);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const calculateMutation = useCalculateOrder();
  const placeMutation = usePlaceOrder();

  // chỉ gửi các dòng còn bán được cho backend (dòng đã gỡ sẽ khiến API trả lỗi)
  const orderLines = useMemo(
    (): OrderLineRequest[] =>
      lines
        .filter((line) => line.isAvailable)
        .map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
    [lines]
  );
  const orderLinesKey = JSON.stringify(orderLines);

  // tính lại giá mỗi khi giỏ đổi hoặc coupon được áp dụng
  useEffect(() => {
    if (orderLines.length === 0) {
      calculateMutation.reset();
      return;
    }
    calculateMutation.mutate({
      lines: orderLines,
      couponCode: appliedCouponCode || undefined,
    });
  }, [orderLinesKey, appliedCouponCode]);

  const calculation = calculateMutation.data ?? null;

  // ưu tiên message thật từ backend (vd "Coupon not applicable" / "Coupon not found")
  const calcErrorMessage = calculateMutation.isError
    ? isAxiosError(calculateMutation.error) &&
      typeof calculateMutation.error.response?.data === "string"
      ? calculateMutation.error.response.data
      : "Không tính được đơn hàng."
    : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (orderLines.length === 0) {
      setFormError("Giỏ hàng của bạn không có sản phẩm nào còn bán được.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const customerName = (formData.get("customerName") as string).trim();
    const customerPhoneNum = (formData.get("customerPhoneNum") as string).trim();
    const customerEmail = (formData.get("customerEmail") as string).trim();
    const address = (formData.get("address") as string).trim();
    const note = (formData.get("note") as string).trim();
    const paymentMethod = formData.get("paymentMethod") as OrderPaymentMethod;

    if (!customerName) {
      setFormError("Vui lòng nhập họ và tên.");
      return;
    }
    if (!customerPhoneNum) {
      setFormError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (provinces && !provinceCode) {
      setFormError("Vui lòng chọn tỉnh / thành phố.");
      return;
    }
    if (!address) {
      setFormError("Vui lòng nhập địa chỉ chi tiết.");
      return;
    }

    const request: PlaceOrderRequest = {
      customerName,
      customerPhoneNum,
      customerEmail: customerEmail || undefined,
      customerAddress: {
        countryCode,
        provinceCode: provinceCode || null,
        provinceName: provinces?.[provinceCode] ?? "",
        address,
      },
      couponCode: appliedCouponCode || undefined,
      paymentMethod,
      note: note || undefined,
      lines: orderLines,
    };

    placeMutation.mutate(request, {
      onSuccess: (order) => {
        clearCart();
        setPlacedOrder(order);
      },
      onError: (error) => {
        setFormError(
          isAxiosError(error) && typeof error.response?.data === "string"
            ? error.response.data
            : "Đặt hàng thất bại. Vui lòng thử lại."
        );
      },
    });
  }

  // chưa rehydrate xong thì chưa biết giỏ có gì, tránh nháy "giỏ trống"
  if (!hasHydrated) {
    return <div className="min-h-[60vh]" />;
  }

  if (placedOrder) {
    return <OrderPlacedScreen order={placedOrder} />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-xl font-bold tracking-widest uppercase">Thanh toán</h1>
        <p className="text-sm text-muted-foreground">
          Giỏ hàng của bạn đang trống nên chưa thể thanh toán.
        </p>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-none px-8 text-xs font-bold tracking-widest uppercase"
        >
          <Link to="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight uppercase">Thanh toán</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_28rem] lg:gap-x-12">
        {/* Cột trái: thông tin người mua */}
        <form
          id="checkout-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-10"
        >
          <Section title="Thông tin liên hệ">
            <Field label="Họ và tên" htmlFor="customerName">
              <input
                id="customerName"
                name="customerName"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Số điện thoại" htmlFor="customerPhoneNum">
                <input
                  id="customerPhoneNum"
                  name="customerPhoneNum"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0912 345 678"
                  className={inputClass}
                />
              </Field>
              <Field label="Email" htmlFor="customerEmail" optional>
                <input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="ban@email.com"
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title="Địa chỉ giao hàng">
            <Field label="Quốc gia" htmlFor="countryCode">
              <Combobox
                id="countryCode"
                items={COUNTRY_ITEMS}
                value={countryCode}
                onChange={(code) => {
                  setCountryCode(code as keyof typeof COUNTRIES);
                  setProvinceCode("");
                }}
                placeholder="Chọn quốc gia"
                searchPlaceholder="Tìm quốc gia…"
              />
              <input type="hidden" name="countryCode" value={countryCode} />
            </Field>

            {provinces ? (
              <Field label="Tỉnh / Thành phố" htmlFor="provinceCode">
                <Combobox
                  id="provinceCode"
                  items={Object.entries(provinces).map(([code, name]) => ({
                    value: code,
                    label: name,
                  }))}
                  value={provinceCode}
                  onChange={setProvinceCode}
                  placeholder="Chọn tỉnh / thành phố"
                  searchPlaceholder="Tìm tỉnh / thành phố…"
                />
                <input type="hidden" name="provinceCode" value={provinceCode} />
                <input
                  type="hidden"
                  name="provinceName"
                  value={provinces[provinceCode] ?? ""}
                />
              </Field>
            ) : null}
            <Field label="Địa chỉ chi tiết" htmlFor="address">
              <input
                id="address"
                name="address"
                autoComplete="street-address"
                placeholder="Số nhà, tên đường, phường / xã, quận / huyện"
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title="Phương thức thanh toán">
            <div className="flex flex-col">
              {PAYMENT_METHODS.map(({ value, label }, index) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-3 border border-border px-4 py-4 text-sm not-first:border-t-0 has-checked:bg-muted"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={value}
                    defaultChecked={index === 0}
                    className="size-3.5 accent-foreground"
                  />
                  {label}
                </label>
              ))}
            </div>
          </Section>

          <Section title="Ghi chú">
            <Field label="Ghi chú cho đơn hàng" htmlFor="note" optional>
              <textarea
                id="note"
                name="note"
                rows={3}
                placeholder="Thời gian nhận hàng, hướng dẫn giao hàng…"
                className={cn(inputClass, "h-auto resize-none py-3")}
              />
            </Field>
          </Section>
        </form>

        {/* Cột phải: giỏ hàng + đặt hàng */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border">
            <h2 className="border-b border-border px-5 py-4 text-xs font-bold tracking-widest uppercase">
              Đơn hàng
            </h2>

            <div className="max-h-[30rem] overflow-y-auto">
              {[...lines]
                .sort((a, b) => b.addedAt - a.addedAt)
                .map((line) => (
                  <CartLineItem key={line.itemId} line={line} size="lg" />
                ))}
            </div>

            <div className="border-b border-border px-5 py-4">
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Mã giảm giá"
                  className={cn(inputClass, "h-10 flex-1")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAppliedCouponCode(couponInput.trim())}
                  disabled={calculateMutation.isPending}
                  className="h-10 shrink-0 rounded-none px-4 text-[11px] font-bold tracking-widest uppercase"
                >
                  Áp dụng
                </Button>
              </div>
              {calcErrorMessage ? (
                <p className="mt-2 text-xs text-destructive">{calcErrorMessage}</p>
              ) : null}
            </div>

            <dl className="flex flex-col gap-2 border-b border-border px-5 py-4 text-xs">
              <SummaryRow
                label="Tạm tính"
                value={formatPrice(calculation?.subtotal ?? subtotal)}
              />
              {calculation && calculation.couponDiscount > 0 ? (
                <SummaryRow
                  label="Giảm giá (mã)"
                  value={`-${formatPrice(calculation.couponDiscount)}`}
                />
              ) : null}
              {calculation && calculation.comboDiscount > 0 ? (
                <SummaryRow
                  label="Giảm giá (combo)"
                  value={`-${formatPrice(calculation.comboDiscount)}`}
                />
              ) : null}
              <SummaryRow
                label="Phí vận chuyển"
                value={
                  calculation
                    ? calculation.shipping > 0
                      ? formatPrice(calculation.shipping)
                      : "Miễn phí"
                    : "Tính khi xác nhận"
                }
                muted={!calculation || calculation.shipping === 0}
              />
            </dl>

            <div className="flex items-baseline justify-between px-5 py-4">
              <span className="text-xs font-bold tracking-widest uppercase">
                Tổng cộng
              </span>
              <span className="text-base font-medium">
                {formatPrice(calculation?.total ?? subtotal)}
              </span>
            </div>
          </div>

          {!isSupportedCountry ? (
            <p className="mt-5 text-xs text-destructive">
              Hiện chưa hỗ trợ giao hàng ngoài Việt Nam.
            </p>
          ) : null}

          {formError ? (
            <p className="mt-5 text-xs text-destructive">{formError}</p>
          ) : null}

          <Button
            type="submit"
            form="checkout-form"
            disabled={!isSupportedCountry || placeMutation.isPending}
            className={cn(
              "h-12 w-full rounded-none bg-foreground text-xs font-bold tracking-widest text-background uppercase hover:bg-foreground/90",
              isSupportedCountry && !formError ? "mt-5" : "mt-3"
            )}
          >
            {placeMutation.isPending ? "Đang đặt hàng…" : "Đặt hàng"}
          </Button>

          <Link
            to="/products"
            className="mt-4 block text-center text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
          >
            Tiếp tục mua sắm
          </Link>
        </aside>
      </div>
    </div>
  );
}

function OrderPlacedScreen({ order }: { order: Order }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-xl font-bold tracking-widest uppercase">
        Đặt hàng thành công
      </h1>
      <p className="text-sm text-muted-foreground">
        Mã đơn của bạn là{" "}
        <span className="font-semibold text-foreground">{order.code}</span>.
        Hãy theo dõi email để nhận thông tin đơn hàng chi tiết.
      </p>
      <p className="text-sm text-muted-foreground">
        Tổng cộng:{" "}
        <span className="font-semibold text-foreground">
          {formatPrice(order.totalAmount)}
        </span>
      </p>
      <Button
        asChild
        variant="outline"
        className="h-12 rounded-none px-8 text-xs font-bold tracking-widest uppercase"
      >
        <Link to="/products">Tiếp tục mua sắm</Link>
      </Button>
    </div>
  );
}

const inputClass =
  "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xs font-bold tracking-widest uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold tracking-widest uppercase"
      >
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground normal-case">
            (không bắt buộc)
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", muted && "text-muted-foreground")}>{value}</dd>
    </div>
  );
}
