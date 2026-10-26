import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { X } from "lucide-react";

import { CartLineItem } from "@/components/shared/cart-line-item";
import { COUNTRIES } from "@/constant/countries";
import { INSTAGRAM_URL } from "@/constant/social";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  CURRENCY,
  LOCALES,
  countryName,
  formatPrice as formatPriceIn,
  getMessages,
  useFormatPrice,
  useLocale,
  useT,
} from "@/i18n";
import type { Locale } from "@/i18n";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { selectSubtotal, useCartStore } from "@/stores/cart.store";
import { useAuthStore } from "@/stores/auth.store";
import { useCalculateOrder, usePlaceOrder } from "@/api/order/query-hooks";
import { meQueryOptions } from "@/api/user/query-hooks";
import type {
  Order,
  OrderLineRequest,
  OrderPaymentMethod,
  PlaceOrderRequest,
} from "@/api/order/api";

export const Route = createFileRoute("/checkout")({
  head: ({ match }) =>
    seo({
      locale: match.context.locale,
      title: getMessages(match.context.locale).seo.checkout.title,
      path: "/checkout",
      noindex: true,
    }),
  component: CheckoutPage,
});

// danh sách quốc gia dựng sẵn cho từng ngôn ngữ
const COUNTRY_ITEMS = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    Object.entries(COUNTRIES).map(([code, country]) => ({
      value: code,
      label: countryName(country, locale),
    })),
  ])
) as Record<Locale, { value: string; label: string }[]>;

// đang hiển thị tiền quy đổi (USD) thì ghi rõ số tiền VND thực thu
function ChargedInVndNote({ amount }: { amount: number }) {
  const t = useT();
  const locale = useLocale();
  if (CURRENCY[locale] === "VND") {
    return null;
  }
  return (
    <p className="text-xs text-muted-foreground">
      {t.checkout.chargedInVnd(formatPriceIn(amount, "vi"))}
    </p>
  );
}

// nhãn lấy theo t.order.paymentMethod[method]
const PAYMENT_METHODS: OrderPaymentMethod[] = [
  "COD",
  // tạm thời chỉ hỗ trợ COD
];

function CheckoutPage() {
  const t = useT();
  const locale = useLocale();
  const formatPrice = useFormatPrice();
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
  // backend ràng buộc coupon theo SĐT (thiếu SĐT là từ chối) => SĐT gửi kèm khi tính đơn,
  // chốt lúc bấm áp dụng mã và mỗi lần rời ô SĐT (không tính lại theo từng phím gõ)
  const [calcPhoneNum, setCalcPhoneNum] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const calculateMutation = useCalculateOrder();
  const placeMutation = usePlaceOrder();

  // đã đăng nhập + có customer => điền sẵn thông tin liên hệ (dùng chung cache với trang /account)
  const authUserId = useAuthStore((s) => s.session?.user.id);
  const { data: me } = useQuery({
    ...meQueryOptions(authUserId ?? ""),
    enabled: !!authUserId,
  });
  const customer = authUserId ? (me?.customer ?? null) : null;

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const hasForm = hasHydrated && !placedOrder && lines.length > 0;

  // input không controlled (submit đọc FormData) => gán thẳng DOM. chỉ điền ô còn trống
  // để không ghi đè thứ user đã gõ; chạy lại khi form vừa hiện (customer có thể về trước form)
  useEffect(() => {
    if (!customer || !hasForm) {
      return;
    }
    fillIfEmpty(nameInputRef.current, customer.name);
    fillIfEmpty(phoneInputRef.current, customer.phoneNum);
    fillIfEmpty(emailInputRef.current, customer.email);
  }, [customer, hasForm]);

  // chỉ gửi các dòng còn bán được cho backend (dòng đã gỡ sẽ khiến API trả lỗi)
  const orderLines = useMemo(
    (): OrderLineRequest[] =>
      lines
        .filter((line) => line.isAvailable)
        .map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
    [lines]
  );
  const orderLinesKey = JSON.stringify(orderLines);
  // SĐT chỉ ảnh hưởng kết quả khi có coupon => không có coupon thì đổi SĐT không tính lại
  const couponPhoneNum = appliedCouponCode ? calcPhoneNum : "";

  // tính lại giá mỗi khi giỏ đổi, coupon được áp dụng hoặc SĐT dùng cho coupon đổi
  useEffect(() => {
    if (orderLines.length === 0) {
      calculateMutation.reset();
      return;
    }
    calculateMutation.mutate({
      lines: orderLines,
      customerPhoneNum: couponPhoneNum || undefined,
      couponCode: appliedCouponCode || undefined,
    });
  }, [orderLinesKey, appliedCouponCode, couponPhoneNum]);

  function handleApplyCoupon() {
    const code = couponInput.trim();
    const phoneNum = phoneInputRef.current?.value.trim() ?? "";
    // thiếu SĐT thì backend chỉ trả "Coupon not applicable", báo rõ lý do ngay ở web
    if (code && !phoneNum) {
      setCouponError(t.checkout.errors.couponNeedsPhone);
      return;
    }
    setCouponError(null);
    setCalcPhoneNum(phoneNum);
    setAppliedCouponCode(code);
  }

  const calculation = calculateMutation.data ?? null;

  // ưu tiên message thật từ backend (vd "Coupon not applicable" / "Coupon not found")
  const calcErrorMessage = calculateMutation.isError
    ? isAxiosError(calculateMutation.error) &&
      typeof calculateMutation.error.response?.data === "string"
      ? calculateMutation.error.response.data
      : t.checkout.errors.calculateFailed
    : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // ngoài VN không có nút đặt hàng, chặn thêm phòng trường hợp submit bằng Enter
    if (!isSupportedCountry) {
      return;
    }
    if (orderLines.length === 0) {
      setFormError(t.checkout.errors.noAvailableLines);
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
      setFormError(t.form.nameRequired);
      return;
    }
    if (!customerPhoneNum) {
      setFormError(t.form.phoneRequired);
      return;
    }
    if (!customerEmail) {
      setFormError(t.checkout.errors.emailRequired);
      return;
    }
    if (provinces && !provinceCode) {
      setFormError(t.checkout.errors.provinceRequired);
      return;
    }
    if (!address) {
      setFormError(t.checkout.errors.addressRequired);
      return;
    }

    const request: PlaceOrderRequest = {
      customerName,
      customerPhoneNum,
      customerEmail,
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
            : t.checkout.errors.placeFailed
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
        <h1 className="text-xl font-bold tracking-widest uppercase">{t.checkout.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.checkout.emptyCart}
        </p>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-none px-8 text-xs font-bold tracking-widest uppercase"
        >
          <Link to="/products">{t.common.continueShopping}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight uppercase">{t.checkout.title}</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_28rem] lg:gap-x-12">
        {/* Cột trái: thông tin người mua */}
        <form
          id="checkout-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-10"
        >
          <Section title={t.checkout.contactSection}>
            <Field label={t.form.fullName} htmlFor="customerName">
              <input
                ref={nameInputRef}
                id="customerName"
                name="customerName"
                autoComplete="name"
                placeholder={t.form.namePlaceholder}
                className={inputClass}
              />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={t.form.phone} htmlFor="customerPhoneNum">
                <input
                  ref={phoneInputRef}
                  id="customerPhoneNum"
                  name="customerPhoneNum"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={t.form.phonePlaceholder}
                  className={inputClass}
                  onBlur={(e) => setCalcPhoneNum(e.currentTarget.value.trim())}
                />
              </Field>
              <Field label={t.form.email} htmlFor="customerEmail">
                <input
                  ref={emailInputRef}
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder={t.form.emailPlaceholder}
                  className={inputClass}
                />
              </Field>
            </div>
          </Section>

          <Section title={t.checkout.shippingSection}>
            <Field label={t.checkout.country} htmlFor="countryCode">
              <Combobox
                id="countryCode"
                items={COUNTRY_ITEMS[locale]}
                value={countryCode}
                onChange={(code) => {
                  setCountryCode(code as keyof typeof COUNTRIES);
                  setProvinceCode("");
                }}
                placeholder={t.form.countryPlaceholder}
                searchPlaceholder={t.form.countrySearch}
              />
              <input type="hidden" name="countryCode" value={countryCode} />
            </Field>

            {provinces ? (
              <Field label={t.checkout.province} htmlFor="provinceCode">
                <Combobox
                  id="provinceCode"
                  items={Object.entries(provinces).map(([code, name]) => ({
                    value: code,
                    label: name,
                  }))}
                  value={provinceCode}
                  onChange={setProvinceCode}
                  placeholder={t.form.provincePlaceholder}
                  searchPlaceholder={t.form.provinceSearch}
                />
                <input type="hidden" name="provinceCode" value={provinceCode} />
                <input
                  type="hidden"
                  name="provinceName"
                  value={provinces[provinceCode] ?? ""}
                />
              </Field>
            ) : null}
            <Field label={t.checkout.addressDetail} htmlFor="address">
              <input
                id="address"
                name="address"
                autoComplete="street-address"
                placeholder={t.form.addressPlaceholder}
                className={inputClass}
              />
            </Field>
          </Section>

          <Section title={t.checkout.paymentSection}>
            <div className="flex flex-col">
              {PAYMENT_METHODS.map((value, index) => (
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
                  {t.order.paymentMethod[value]}
                </label>
              ))}
            </div>
          </Section>

          <Section title={t.checkout.noteSection}>
            <Field label={t.checkout.noteLabel} htmlFor="note" optional>
              <textarea
                id="note"
                name="note"
                rows={3}
                placeholder={t.checkout.notePlaceholder}
                className={cn(inputClass, "h-auto resize-none py-3")}
              />
            </Field>
          </Section>
        </form>

        {/* Cột phải: giỏ hàng + đặt hàng */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border">
            <h2 className="border-b border-border px-5 py-4 text-xs font-bold tracking-widest uppercase">
              {t.checkout.orderSection}
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
                <div className="relative flex-1">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={t.checkout.couponPlaceholder}
                    className={cn(inputClass, "h-10 pr-10")}
                  />
                  {couponInput || appliedCouponCode ? (
                    // xoá cả mã đang áp dụng => effect tính lại đơn không kèm coupon
                    <button
                      type="button"
                      aria-label={t.checkout.clearCoupon}
                      onClick={() => {
                        setCouponInput("");
                        setAppliedCouponCode("");
                        setCouponError(null);
                      }}
                      className="absolute top-0 right-0 flex size-10 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X aria-hidden className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={calculateMutation.isPending}
                  className="h-10 shrink-0 rounded-none px-4 text-[11px] font-bold tracking-widest uppercase"
                >
                  {t.checkout.apply}
                </Button>
              </div>
              {couponError || calcErrorMessage ? (
                <p className="mt-2 text-xs text-destructive">
                  {couponError ?? calcErrorMessage}
                </p>
              ) : null}
            </div>

            <dl className="flex flex-col gap-2 border-b border-border px-5 py-4 text-xs">
              <SummaryRow
                label={t.order.subtotal}
                value={formatPrice(calculation?.subtotal ?? subtotal)}
              />
              {calculation && calculation.couponDiscount > 0 ? (
                <SummaryRow
                  label={t.order.couponDiscount}
                  value={`-${formatPrice(calculation.couponDiscount)}`}
                />
              ) : null}
              {calculation && calculation.comboDiscount > 0 ? (
                <SummaryRow
                  label={t.order.comboDiscount}
                  value={`-${formatPrice(calculation.comboDiscount)}`}
                />
              ) : null}
              <SummaryRow
                label={t.order.shipping}
                value={
                  calculation
                    ? calculation.shipping > 0
                      ? formatPrice(calculation.shipping)
                      : t.order.free
                    : t.checkout.shippingPending
                }
                muted={!calculation || calculation.shipping === 0}
              />
            </dl>

            <div className="flex items-baseline justify-between px-5 py-4">
              <span className="text-xs font-bold tracking-widest uppercase">
                {t.order.total}
              </span>
              <span className="text-base font-medium">
                {formatPrice(calculation?.total ?? subtotal)}
              </span>
            </div>
            <div className="-mt-2 px-5 pb-4 text-right">
              <ChargedInVndNote amount={calculation?.total ?? subtotal} />
            </div>
          </div>

          {!isSupportedCountry ? (
            <p className="mt-5 text-xs">
              {t.checkout.internationalNote}
            </p>
          ) : null}

          {formError ? (
            <p className="mt-5 text-xs text-destructive">{formError}</p>
          ) : null}

          {isSupportedCountry ? (
            <Button
              type="submit"
              form="checkout-form"
              disabled={placeMutation.isPending}
              className={cn(submitClass, formError ? "mt-3" : "mt-5")}
            >
              {placeMutation.isPending
                ? t.checkout.placingOrder
                : t.checkout.placeOrder}
            </Button>
          ) : (
            // ngoài VN chưa đặt online được: chuyển khách sang Instagram để tư vấn
            <Button asChild className={cn(submitClass, "mt-3")}>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                {t.common.contactUs}
              </a>
            </Button>
          )}

          <Link
            to="/products"
            className="mt-4 block text-center text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
          >
            {t.common.continueShopping}
          </Link>
        </aside>
      </div>
    </div>
  );
}

function OrderPlacedScreen({ order }: { order: Order }) {
  const t = useT();
  const formatPrice = useFormatPrice();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-xl font-bold tracking-widest uppercase">
        {t.checkout.successTitle}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t.checkout.successCode(
          <span className="font-semibold text-foreground">{order.code}</span>
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        {t.checkout.successTotal(
          <span className="font-semibold text-foreground">
            {formatPrice(order.totalAmount)}
          </span>
        )}
      </p>
      <ChargedInVndNote amount={order.totalAmount} />
      <Button
        asChild
        variant="outline"
        className="h-12 rounded-none px-8 text-xs font-bold tracking-widest uppercase"
      >
        <Link to="/products">{t.common.continueShopping}</Link>
      </Button>
    </div>
  );
}

const submitClass =
  "h-12 w-full rounded-none bg-foreground text-xs font-bold tracking-widest text-background uppercase hover:bg-foreground/90";

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
  const t = useT();

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold tracking-widest uppercase"
      >
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground normal-case">
            {t.checkout.optional}
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

function fillIfEmpty(input: HTMLInputElement | null, value: string | null) {
  if (input && !input.value && value) {
    input.value = value;
  }
}
