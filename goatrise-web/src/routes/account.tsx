import { useRef, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, ChevronDown, Plus, X } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";

import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { RollText } from "@/components/shared/roll-text";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { COUNTRIES } from "@/constant/countries";
import { auth } from "@/core/auth";
import { cn, formatPrice, getColorName } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { meQueryOptions } from "@/api/user/query-hooks";
import { myOrdersInfiniteQueryOptions } from "@/api/order/query-hooks";
import { useUpdateMyCustomer } from "@/api/customer/query-hooks";
import type { UserDetail } from "@/api/user/api";
import type { Customer } from "@/api/customer/api";
import type {
  Address,
  Order,
  OrderLineBase,
  OrderPaymentMethod,
  OrderPaymentStatus,
} from "@/api/order/api";

export const Route = createFileRoute("/account")({ component: AccountPage });

const HEADING_CLASS = "text-3xl font-extrabold tracking-[-0.03em] uppercase";

const PRIMARY_CLASS =
  "group flex h-11 w-full items-center justify-center gap-2.5 bg-foreground text-[10px] font-bold tracking-[0.18em] text-background uppercase transition-colors duration-300 hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-60";

// cùng kiểu nút chữ bên phải header chung
const HEADER_ACTION_CLASS =
  "group -my-3 py-3 text-[11px] font-bold tracking-[0.08em] whitespace-nowrap uppercase opacity-60 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none";

// trang không có header của site: chiếm trọn màn hình, footer (h-14) nằm ngay dưới mép
const SCREEN_CLASS = "min-h-[calc(100svh-3.5rem)]";

// nút viền: cùng khung PRIMARY_CLASS, đảo màu khi hover
const SECONDARY_CLASS = cn(
  PRIMARY_CLASS,
  "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background"
);

const SECTION_TITLE_CLASS = "text-xs font-bold tracking-widest uppercase";

// cùng kiểu ô nhập / nhãn với form checkout
const INPUT_CLASS =
  "h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground";

const FIELD_LABEL_CLASS = "text-[11px] font-semibold tracking-widest uppercase";

const COUNTRY_ITEMS = Object.entries(COUNTRIES).map(([code, country]) => ({
  value: code,
  label: country.viName,
}));

const RETRY_CLASS =
  "cursor-pointer font-semibold text-foreground underline underline-offset-2 hover:opacity-70";

const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const DELIVERY_STATUS_LABELS: Record<Order["deliveryStatus"], string> = {
  PENDING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  RETURNED: "Đã hoàn trả",
};

const PAYMENT_METHOD_LABELS: Record<OrderPaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  MANUAL_TRANSFER: "Chuyển khoản",
  MOMO: "MoMo",
  VNPAY: "VNPay",
  STRIPE: "Thẻ quốc tế",
};

const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function AccountPage() {
  const session = useAuthStore((s) => s.session);
  const isReady = useAuthStore((s) => s.isReady);

  // chưa biết đăng nhập hay chưa (SSR / đang đọc localStorage): giữ chỗ, không nháy nội dung sai
  if (!isReady) return <div className={SCREEN_CLASS} />;

  return session ? <SignedInPanel authUser={session.user} /> : <SignInPanel />;
}

// Header riêng của trang tài khoản (header chung của site đã ẩn ở __root),
// cùng khung / cỡ chữ với header chung để chuyển trang không bị giật
function AccountHeader() {
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    // thành công thì store nhận SIGNED_OUT và trang tự đổi sang đăng nhập
    await auth.signOut();
    setIsPending(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between gap-4 px-5 md:h-16 lg:px-10">
        <Link
          to="/"
          aria-label="GOAT RISE — về trang chủ"
          className="-my-2 py-2 font-logo text-[1.75rem] font-extrabold uppercase md:text-[2.125rem]"
        >
          <BrandWordmark />
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/products" className={HEADER_ACTION_CLASS}>
            <RollText label="Cửa hàng" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className={HEADER_ACTION_CLASS}
          >
            <RollText label={isPending ? "Đang đăng xuất…" : "Đăng xuất"} />
          </button>
        </nav>
      </div>
    </header>
  );
}

function SignInPanel() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setIsPending(true);
    setError(null);

    // đăng nhập xong Supabase trả về đúng trang này kèm ?code=, client tự đổi code lấy session
    const { error: signInError } = await auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });

    // thành công thì trình duyệt đã chuyển sang Google, chỉ lỗi mới quay lại đây
    if (signInError) {
      setError("Không thể kết nối tới Google. Vui lòng thử lại.");
      setIsPending(false);
    }
  }

  return (
    <div
      className={`${SCREEN_CLASS} flex items-center justify-center px-6 py-16`}
    >
      {/* rise-fade: cả khối hiện một lần, chạy lại khi đổi giữa đăng nhập / tài khoản */}
      <div className="rise-fade w-full max-w-xs text-center">
        {/* không có header của site => đây là lối quay về cửa hàng */}
        <Link
          to="/"
          className={`${HEADER_ACTION_CLASS} inline-flex items-center gap-2`}
        >
          <ArrowLeft
            aria-hidden
            className="size-3.5 transition-transform duration-300 group-hover:-translate-x-1"
          />
          <RollText label="Về trang chủ" />
        </Link>

        <div className="mt-12 flex flex-col items-center">
          {/* ảnh vuông, con dê chỉ chiếm phần giữa => margin âm bù lề trống trên / dưới */}
          <img
            src="/goatrise-bg-logo.png"
            alt=""
            aria-hidden
            className="-mt-7 -mb-6 size-28"
          />
          <BrandWordmark className="text-2xl" />
        </div>

        <h1 className="mt-12 text-xl font-extrabold tracking-[-0.02em] uppercase">
          Đăng nhập
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trở thành thành viên của GOAT RISE
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={isPending}
          className={`${PRIMARY_CLASS} mt-8`}
        >
          <GoogleIcon className="size-4" />
          <RollText
            label={
              isPending ? "Đang chuyển tới Google…" : "Tiếp tục với Google"
            }
          />
        </button>

        {error ? (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SignedInPanel({ authUser }: { authUser: AuthUser }) {
  // key theo id tài khoản Supabase: đổi tài khoản không dùng nhầm cache của người trước
  const meQuery = useQuery(meQueryOptions(authUser.id));
  const ordersQuery = useInfiniteQuery(
    myOrdersInfiniteQueryOptions(authUser.id)
  );

  return (
    <div className={SCREEN_CLASS}>
      <AccountHeader />

      <section className="rise-fade mx-auto w-full max-w-[1500px] px-5 py-12 lg:px-10 lg:py-16">
        <h1 className={HEADING_CLASS}>Tài khoản</h1>

        <div className="mt-10 grid gap-12 lg:mt-12 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-16">
          <ProfilePanel
            authUser={authUser}
            me={meQuery.data}
            isPending={meQuery.isPending}
            isError={meQuery.isError}
            onRetry={() => void meQuery.refetch()}
          />
          <OrdersPanel
            orders={ordersQuery.data?.pages.flat()}
            isPending={ordersQuery.isPending}
            onRetry={() => void ordersQuery.refetch()}
            hasMore={ordersQuery.hasNextPage}
            isLoadingMore={ordersQuery.isFetchingNextPage}
            isLoadMoreError={ordersQuery.isFetchNextPageError}
            onLoadMore={() => void ordersQuery.fetchNextPage()}
          />
        </div>
      </section>
    </div>
  );
}

function ProfilePanel({
  authUser,
  me,
  isPending,
  isError,
  onRetry,
}: {
  authUser: AuthUser;
  me: UserDetail | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  // backend chưa trả về thì tạm dùng thông tin Google trong session để không nháy trống
  const fullName: string | undefined =
    me?.fullName ||
    authUser.user_metadata.full_name ||
    authUser.user_metadata.name ||
    undefined;
  const email = me?.email ?? authUser.email ?? "";
  const avtUrl: string | null =
    me?.avtUrl ?? authUser.user_metadata.picture ?? null;
  const customer = me?.customer ?? null;

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      {/* header: thông tin tài khoản Google (user), không sửa được */}
      <div className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden bg-muted text-lg font-bold uppercase">
          {avtUrl ? (
            <img
              src={avtUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          ) : (
            (fullName ?? email).charAt(0)
          )}
        </div>
        <div className="min-w-0">
          {fullName ? (
            <p className="truncate text-sm font-semibold">{fullName}</p>
          ) : null}
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {email}
          </p>
        </div>
      </div>

      {/* thông tin mua hàng: lấy từ customer, sửa qua dialog */}
      <div className="mt-8 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className={SECTION_TITLE_CLASS}>Thông tin mua hàng</h2>
          {/* chưa có customer vẫn cho cập nhật: backend upsert, tạo customer theo email */}
          {me ? (
            <CustomerInfoDialog
              authUserId={authUser.id}
              customer={me.customer}
              defaultName={me.fullName}
            />
          ) : null}
        </div>

        {isPending ? (
          <div aria-busy="true" className="mt-4 flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 animate-pulse bg-muted" />
            ))}
          </div>
        ) : customer ? (
          <>
            <dl className="mt-4 flex flex-col gap-2.5 text-xs">
              <InfoRow label="Họ và tên" value={customer.name} />
              <InfoRow
                label="Số điện thoại"
                value={customer.phoneNum ?? "Chưa cập nhật"}
                muted={!customer.phoneNum}
              />
            </dl>

            <div className="mt-4 text-xs">
              <p className="text-muted-foreground">Địa chỉ</p>
              {customer.addresses.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {customer.addresses.map((address, index) => (
                    <li
                      key={index}
                      className="border border-border px-3 py-2.5 leading-relaxed"
                    >
                      {formatAddress(address)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1.5 text-muted-foreground">
                  Chưa có địa chỉ nào.
                </p>
              )}
            </div>
          </>
        ) : me ? (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Bạn chưa có thông tin mua hàng. Bấm cập nhật để thêm tên, số điện
            thoại và địa chỉ nhận hàng.
          </p>
        ) : null}
      </div>

      {customer ? (
        <dl className="mt-8 flex flex-col gap-2.5 border-t border-border pt-5 text-xs">
          <InfoRow
            label="Tổng đơn hàng"
            value={String(customer.totalOrders)}
          />
          <InfoRow
            label="Tổng chi tiêu"
            value={formatPrice(customer.totalSpent)}
          />
        </dl>
      ) : null}

      {isError ? (
        <p role="alert" className="mt-5 text-xs text-destructive">
          Không tải được thông tin tài khoản.{" "}
          <button type="button" onClick={onRetry} className={RETRY_CLASS}>
            Thử lại
          </button>
        </p>
      ) : null}
    </aside>
  );
}

function CustomerInfoDialog({
  authUserId,
  customer,
  defaultName,
}: {
  authUserId: string;
  customer: Customer | null;
  defaultName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button type="button" className={HEADER_ACTION_CLASS}>
          <RollText label="Cập nhật" />
        </button>
      </DialogTrigger>
      {/* Radix chỉ mount nội dung khi mở => form khởi tạo lại từ customer mới nhất mỗi lần mở */}
      <DialogContent className="max-w-lg">
        <CustomerInfoForm
          authUserId={authUserId}
          customer={customer}
          defaultName={defaultName}
          onDone={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type AddressDraft = {
  key: number; // key ổn định cho list khi thêm / xoá
  countryCode: string;
  provinceCode: string;
  provinceName: string;
  address: string;
};

function CustomerInfoForm({
  authUserId,
  customer,
  defaultName,
  onDone,
}: {
  authUserId: string;
  // null: chưa có customer, lưu lần đầu sẽ tạo mới
  customer: Customer | null;
  // tên điền sẵn khi chưa có customer (lấy từ user)
  defaultName: string;
  onDone: () => void;
}) {
  const nextKey = useRef(0);
  const [name, setName] = useState(customer?.name ?? defaultName);
  const [phoneNum, setPhoneNum] = useState(customer?.phoneNum ?? "");
  const [addresses, setAddresses] = useState<AddressDraft[]>(() =>
    (customer?.addresses ?? []).map((address) => ({
      key: nextKey.current++,
      countryCode: address.countryCode,
      provinceCode: address.provinceCode ?? "",
      provinceName: address.provinceName,
      address: address.address,
    }))
  );
  const [formError, setFormError] = useState<string | null>(null);

  const updateMutation = useUpdateMyCustomer(authUserId);

  function updateAddress(key: number, patch: Partial<AddressDraft>) {
    setAddresses((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft))
    );
  }

  function addAddress() {
    setAddresses((prev) => [
      ...prev,
      {
        key: nextKey.current++,
        countryCode: "VN",
        provinceCode: "",
        provinceName: "",
        address: "",
      },
    ]);
  }

  function removeAddress(key: number) {
    setAddresses((prev) => prev.filter((draft) => draft.key !== key));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const trimmedPhoneNum = phoneNum.trim();

    if (!trimmedName) {
      setFormError("Vui lòng nhập họ và tên.");
      return;
    }
    // backend không cho xoá SĐT (chỉ sửa): đã có rồi thì không được để trống
    if (!trimmedPhoneNum && customer?.phoneNum) {
      setFormError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (trimmedPhoneNum.length > 20) {
      setFormError("Số điện thoại không hợp lệ.");
      return;
    }

    const nextAddresses: Address[] = [];
    for (const [index, draft] of addresses.entries()) {
      const provinces = getProvinces(draft.countryCode);
      if (provinces && !draft.provinceCode) {
        setFormError(`Địa chỉ ${index + 1}: vui lòng chọn tỉnh / thành phố.`);
        return;
      }
      if (!draft.address.trim()) {
        setFormError(`Địa chỉ ${index + 1}: vui lòng nhập địa chỉ chi tiết.`);
        return;
      }
      nextAddresses.push({
        countryCode: draft.countryCode,
        provinceCode: provinces ? draft.provinceCode : null,
        provinceName: provinces ? draft.provinceName : "",
        address: draft.address.trim(),
      });
    }

    updateMutation.mutate(
      {
        name: trimmedName,
        phoneNum: trimmedPhoneNum || undefined,
        addresses: nextAddresses,
      },
      {
        onSuccess: onDone,
        onError: (error) => {
          setFormError(
            isAxiosError(error) && typeof error.response?.data === "string"
              ? error.response.data
              : "Cập nhật thất bại. Vui lòng thử lại."
          );
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col">
      <div className="border-b border-border px-6 py-5 pr-14">
        <DialogTitle>Thông tin mua hàng</DialogTitle>
        <DialogDescription className="mt-1.5">
          Tên, số điện thoại và địa chỉ nhận hàng của bạn.
        </DialogDescription>
      </div>

      <fieldset
        disabled={updateMutation.isPending}
        className="flex flex-col gap-5 px-6 py-6"
      >
        <FormField label="Họ và tên" htmlFor="customer-name">
          <input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={100}
            placeholder="Nguyễn Văn A"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Số điện thoại" htmlFor="customer-phone">
          <input
            id="customer-phone"
            type="tel"
            inputMode="tel"
            value={phoneNum}
            onChange={(e) => setPhoneNum(e.target.value)}
            autoComplete="tel"
            maxLength={20}
            placeholder="0912 345 678"
            className={INPUT_CLASS}
          />
        </FormField>

        <div className="flex flex-col gap-3">
          <p className={FIELD_LABEL_CLASS}>Địa chỉ</p>

          {addresses.map((draft, index) => {
            const provinces = getProvinces(draft.countryCode);
            const idPrefix = `customer-address-${draft.key}`;

            return (
              <div
                key={draft.key}
                className="flex flex-col gap-3 border border-border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Địa chỉ {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAddress(draft.key)}
                    aria-label={`Xoá địa chỉ ${index + 1}`}
                    className="-m-1.5 cursor-pointer p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <Combobox
                  id={`${idPrefix}-country`}
                  modal
                  items={COUNTRY_ITEMS}
                  value={draft.countryCode}
                  onChange={(code) =>
                    updateAddress(draft.key, {
                      countryCode: code,
                      provinceCode: "",
                      provinceName: "",
                    })
                  }
                  placeholder="Chọn quốc gia"
                  searchPlaceholder="Tìm quốc gia…"
                />

                {provinces ? (
                  <Combobox
                    id={`${idPrefix}-province`}
                    modal
                    items={Object.entries(provinces).map(([code, label]) => ({
                      value: code,
                      label,
                    }))}
                    value={draft.provinceCode}
                    onChange={(code) =>
                      updateAddress(draft.key, {
                        provinceCode: code,
                        provinceName: provinces[code] ?? "",
                      })
                    }
                    placeholder="Chọn tỉnh / thành phố"
                    searchPlaceholder="Tìm tỉnh / thành phố…"
                  />
                ) : null}

                <input
                  id={`${idPrefix}-detail`}
                  aria-label={`Địa chỉ chi tiết ${index + 1}`}
                  value={draft.address}
                  onChange={(e) =>
                    updateAddress(draft.key, { address: e.target.value })
                  }
                  autoComplete="street-address"
                  placeholder="Số nhà, tên đường, phường / xã, quận / huyện"
                  className={INPUT_CLASS}
                />
              </div>
            );
          })}

          <button
            type="button"
            onClick={addAddress}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 border border-dashed border-border text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase transition-colors duration-300 hover:border-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Thêm địa chỉ
          </button>
        </div>
      </fieldset>

      {/* dính đáy vùng cuộn của dialog: danh sách địa chỉ dài vẫn thấy nút lưu */}
      <div className="sticky bottom-0 border-t border-border bg-background px-6 py-4">
        {formError ? (
          <p role="alert" className="mb-3 text-xs text-destructive">
            {formError}
          </p>
        ) : null}
        <div className="flex gap-3">
          <DialogClose asChild>
            <button
              type="button"
              disabled={updateMutation.isPending}
              className={cn(SECONDARY_CLASS, "flex-1")}
            >
              <RollText label="Huỷ" />
            </button>
          </DialogClose>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className={cn(PRIMARY_CLASS, "flex-1")}
          >
            <RollText
              label={updateMutation.isPending ? "Đang lưu…" : "Lưu"}
            />
          </button>
        </div>
      </div>
    </form>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      {children}
    </div>
  );
}

function OrdersPanel({
  orders,
  isPending,
  onRetry,
  hasMore,
  isLoadingMore,
  isLoadMoreError,
  onLoadMore,
}: {
  orders: Order[] | undefined;
  isPending: boolean;
  onRetry: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  isLoadMoreError: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="min-w-0">
      <div className="border-b border-border pb-4">
        <h2 className={SECTION_TITLE_CLASS}>Đơn hàng của tôi</h2>
      </div>

      {isPending ? (
        <div aria-busy="true" className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[4.75rem] animate-pulse bg-muted" />
          ))}
        </div>
      ) : !orders ? (
        // lỗi ở lần tải đầu (chưa có trang nào); lỗi khi tải thêm thì giữ list, báo ở dưới

        <p role="alert" className="mt-6 text-xs text-destructive">
          Không tải được đơn hàng.{" "}
          <button type="button" onClick={onRetry} className={RETRY_CLASS}>
            Thử lại
          </button>
        </p>
      ) : orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-6 border border-border px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            Bạn chưa có đơn hàng nào.
          </p>
          <Link to="/products" className={cn(PRIMARY_CLASS, "w-auto px-8")}>
            <RollText label="Mua sắm ngay" />
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>

          {hasMore ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              {isLoadMoreError ? (
                <p role="alert" className="text-xs text-destructive">
                  Không tải thêm được đơn hàng.
                </p>
              ) : null}
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className={cn(SECONDARY_CLASS, "w-auto px-8")}
              >
                <RollText
                  label={
                    isLoadingMore
                      ? "Đang tải…"
                      : isLoadMoreError
                        ? "Thử lại"
                        : "Xem thêm"
                  }
                />
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const detailsId = `order-${order.id}`;

  return (
    <article className="border border-border">
      {/* lưới 3 cột: mã + trạng thái / ngày + tổng tiền, mũi tên chiếm 2 hàng bên phải */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={detailsId}
        className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1.5 px-5 py-4 text-left transition-colors duration-300 hover:bg-muted/40"
      >
        <span className="truncate text-xs font-bold tracking-widest uppercase">
          Đơn {order.code}
        </span>
        <OrderStatusBadge order={order} />
        <ChevronDown
          aria-hidden
          className={cn(
            "row-span-2 size-4 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
        <span className="truncate text-xs text-muted-foreground">
          {DATE_FORMAT.format(new Date(order.createdAt))} · {itemCount} sản
          phẩm
        </span>
        <span className="justify-self-end text-sm font-medium whitespace-nowrap">
          {formatPrice(order.totalAmount)}
        </span>
      </button>

      {isOpen ? (
        <div id={detailsId} className="border-t border-border">
          <ul>
            {order.lines.map((line) => (
              <OrderLineRow key={line.id} line={line} />
            ))}
          </ul>

          <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-2 md:gap-10">
            <div className="flex flex-col gap-5 text-xs">
              <InfoBlock title="Người nhận">
                <p className="font-medium">{order.customerName}</p>
                {order.customerPhoneNum ? (
                  <p className="text-muted-foreground">
                    {order.customerPhoneNum}
                  </p>
                ) : null}
                {order.customerAddress ? (
                  <p className="text-muted-foreground">
                    {formatAddress(order.customerAddress)}
                  </p>
                ) : null}
              </InfoBlock>
              <InfoBlock title="Thanh toán">
                <p className="font-medium">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
                <p className="text-muted-foreground">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                </p>
              </InfoBlock>
            </div>

            <dl className="flex flex-col gap-2 text-xs">
              <InfoRow
                label="Tạm tính"
                value={formatPrice(order.subtotalAmount)}
              />
              {order.couponDiscountAmount > 0 ? (
                <InfoRow
                  label={
                    order.coupon
                      ? `Giảm giá (mã ${order.coupon.code})`
                      : "Giảm giá (mã)"
                  }
                  value={`-${formatPrice(order.couponDiscountAmount)}`}
                />
              ) : null}
              {order.comboDiscountAmount > 0 ? (
                <InfoRow
                  label="Giảm giá (combo)"
                  value={`-${formatPrice(order.comboDiscountAmount)}`}
                />
              ) : null}
              {order.manualDiscountAmount > 0 ? (
                <InfoRow
                  label="Giảm giá khác"
                  value={`-${formatPrice(order.manualDiscountAmount)}`}
                />
              ) : null}
              <InfoRow
                label="Phí vận chuyển"
                value={
                  order.shippingAmount > 0
                    ? formatPrice(order.shippingAmount)
                    : "Miễn phí"
                }
                muted={order.shippingAmount === 0}
              />
              {order.taxAmount > 0 ? (
                <InfoRow label="Thuế" value={formatPrice(order.taxAmount)} />
              ) : null}
              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
                <dt className="font-bold tracking-widest uppercase">
                  Tổng cộng
                </dt>
                <dd className="text-sm font-medium">
                  {formatPrice(order.totalAmount)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function OrderLineRow({ line }: { line: OrderLineBase }) {
  const { snapItem } = line;
  const image = snapItem.imgUrl ?? snapItem.product?.imgUrls?.[0] ?? null;
  const title = snapItem.product?.title.vi ?? snapItem.name;
  const color = snapItem.attributeValues.COLOR;
  const variant =
    [color ? getColorName(color) : null, snapItem.attributeValues.SIZE]
      .filter(Boolean)
      .join(" / ") || snapItem.sku;

  return (
    <li className="flex gap-4 border-b border-border px-5 py-4 last:border-b-0">
      <div className="size-16 shrink-0 overflow-hidden bg-muted">
        {image ? (
          <img src={image} alt={title} className="size-full object-cover" />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {snapItem.product ? (
          <Link
            to="/products/$slug"
            params={{ slug: snapItem.product.slug }}
            className="truncate text-xs font-medium tracking-wide uppercase hover:underline"
          >
            {title}
          </Link>
        ) : (
          <p className="truncate text-xs font-medium tracking-wide uppercase">
            {title}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{variant}</p>

        <div className="mt-auto flex items-baseline justify-between gap-3 pt-2 text-xs">
          <span className="text-muted-foreground">
            {line.quantity} × {formatPrice(line.unitPrice)}
          </span>
          <span className="font-medium whitespace-nowrap">
            {formatPrice(line.subtotalAmount)}
          </span>
        </div>
      </div>
    </li>
  );
}

function OrderStatusBadge({ order }: { order: Order }) {
  // huỷ / chờ xác nhận ưu tiên hơn tình trạng giao hàng
  const isCancelled = order.status === "CANCELLED";
  const isDelivered =
    order.status === "CONFIRMED" && order.deliveryStatus === "DELIVERED";
  const label = isCancelled
    ? "Đã huỷ"
    : order.status === "PENDING"
      ? "Chờ xác nhận"
      : DELIVERY_STATUS_LABELS[order.deliveryStatus];

  return (
    <span
      className={cn(
        "justify-self-end border px-2 py-1 text-[10px] font-bold tracking-[0.12em] whitespace-nowrap uppercase",
        isCancelled
          ? "border-border text-muted-foreground"
          : isDelivered
            ? "border-foreground bg-foreground text-background"
            : "border-foreground"
      )}
    >
      {label}
    </span>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-1 text-[11px] font-semibold tracking-widest uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right font-medium",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// chỉ quốc gia có danh sách tỉnh/thành trong COUNTRIES (hiện là VN) mới bắt chọn tỉnh
function getProvinces(countryCode: string): Record<string, string> | undefined {
  const countries: Partial<
    Record<string, { viName: string; provinces?: Record<string, string> }>
  > = COUNTRIES;
  return countries[countryCode]?.provinces;
}

function formatAddress(address: Address): string {
  const countries: Partial<Record<string, { viName: string }>> = COUNTRIES;
  return [
    address.address,
    address.provinceName,
    countries[address.countryCode]?.viName,
  ]
    .filter(Boolean)
    .join(", ");
}
