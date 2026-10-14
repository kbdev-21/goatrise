import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { RollText } from "@/components/shared/roll-text";
import { auth } from "@/core/auth";
import { useAuthStore } from "@/stores/auth.store";

export const Route = createFileRoute("/account")({ component: AccountPage });

const HEADING_CLASS = "text-3xl font-extrabold tracking-[-0.03em] uppercase";

const PRIMARY_CLASS =
  "group flex h-11 w-full items-center justify-center gap-2.5 bg-foreground text-[10px] font-bold tracking-[0.18em] text-background uppercase transition-colors duration-300 hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-60";

// cùng kiểu nút chữ bên phải header chung
const HEADER_ACTION_CLASS =
  "group -my-3 py-3 text-[11px] font-bold tracking-[0.08em] whitespace-nowrap uppercase opacity-60 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100 disabled:pointer-events-none";

// trang không có header của site: chiếm trọn màn hình, footer (h-14) nằm ngay dưới mép
const SCREEN_CLASS = "min-h-[calc(100svh-3.5rem)]";

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

  return session ? <SignedInPanel user={session.user} /> : <SignInPanel />;
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
          Chào mừng bạn đến với GOAT RISE
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

function SignedInPanel({ user }: { user: User }) {
  const fullName: string | undefined =
    user.user_metadata.full_name ?? user.user_metadata.name;

  return (
    <div className={SCREEN_CLASS}>
      <AccountHeader />

      <section className="rise-fade mx-auto w-full max-w-[1500px] px-5 py-12 lg:px-10 lg:py-16">
        <h1 className={HEADING_CLASS}>Tài khoản</h1>
        {fullName ? (
          <p className="mt-3 text-sm font-semibold">{fullName}</p>
        ) : null}
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {user.email}
        </p>
      </section>
    </div>
  );
}
