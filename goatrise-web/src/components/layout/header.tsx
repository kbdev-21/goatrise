import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { navItems } from "@/components/layout/nav-config";
import { RollText } from "@/components/shared/roll-text";
import { selectItemCount, useCartStore } from "@/stores/cart.store";

// Dưới ngưỡng này header luôn hiện, tránh giật khi cuộn nhẹ ở đầu trang
const HIDE_THRESHOLD = 180;
// Bỏ qua rung lắc nhỏ của trackpad, chỉ đổi trạng thái khi thật sự đổi hướng
const DIRECTION_DELTA = 6;

const LABEL_CLASS = "text-[11px] font-bold tracking-[0.08em] uppercase";
const ACTION_CLASS = cn(
  LABEL_CLASS,
  "group -my-3 flex items-baseline gap-1.5 py-3 opacity-60 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
);

export function Header() {
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const isHome = useRouterState({
    select: (s) => s.location.pathname === "/",
  });
  const openCart = useCartStore((s) => s.openCart);
  const cartCount = useCartStore(selectItemCount);
  // chỉ hiện số thật sau khi rehydrate xong để server và client render giống nhau
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  useEffect(() => {
    let frame = 0;
    // trình duyệt có thể khôi phục vị trí cuộn cũ; lấy mốc thật để lần chạy
    // đầu tiên không bị hiểu nhầm là "đang cuộn xuống" rồi giấu header đi
    lastY.current = window.scrollY;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY.current;

      // đổi nền ngay khi rời đỉnh để có phản hồi tức thì
      setAtTop(y <= 8);

      if (Math.abs(delta) < DIRECTION_DELTA) return;
      // cuộn xuống thì header trượt lên giấu đi, cuộn lên là trượt ra lại
      setHidden(y > HIDE_THRESHOLD && delta > 0);
      lastY.current = y;
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Chỉ trong suốt khi đứng ở đầu trang chủ (nơi có hero tối phía sau)
  const transparent = isHome && atTop;
  const count = hasHydrated ? cartCount : 0;

  return (
    <header
      className={cn(
        "header-shell fixed inset-x-0 top-0 z-40 border-b",
        hidden ? "-translate-y-full" : "translate-y-0",
        transparent
          ? "border-transparent bg-transparent text-white"
          : "border-border bg-background/100 text-foreground backdrop-blur-xl"
      )}
      onFocusCapture={() => setHidden(false)}
    >
      <div className="mx-auto grid h-12 w-full max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 md:h-16 lg:px-10">
        <div className="flex items-center gap-5">
          {/* Mobile: chỉ hiện nút Menu */}
          <MobileMenu triggerClassName="-ml-3 flex size-11 items-center justify-center opacity-70 transition-opacity duration-300 hover:opacity-100 md:hidden" />

          {/* Desktop: hiện toàn bộ nav */}
          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: true }}
                className={cn(
                  LABEL_CLASS,
                  "group -my-3 py-3 opacity-60 transition-opacity duration-300 hover:opacity-100 data-[status=active]:opacity-100"
                )}
              >
                <RollText label={item.label} />
              </Link>
            ))}
          </nav>
        </div>

        <Link
          to="/"
          aria-label="GOAT RISE — về trang chủ"
          className="-my-2 justify-self-center py-2 font-logo text-xl font-extrabold tracking-[0.12em] uppercase sm:text-2xl"
        >
          GOAT RISE
        </Link>

        <div className="flex items-center gap-4 justify-self-end md:gap-6">
          <button type="button" aria-label="Tìm kiếm" className={ACTION_CLASS}>
            <RollText label="Search" />
          </button>

          <button
            type="button"
            aria-label="Tài khoản"
            className={cn(ACTION_CLASS, "hidden md:flex")}
          >
            <RollText label="Account" />
          </button>

          <button
            type="button"
            aria-label={
              count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng, đang trống"
            }
            onClick={openCart}
            className={ACTION_CLASS}
          >
            <RollText label="Cart" />
            {/* số lượng luôn 2 chữ số để bề ngang không nhảy */}
            <span aria-hidden className="tabular-nums opacity-65">
              {String(Math.min(count, 99)).padStart(2, "0")}
            </span>
          </button>
        </div>
      </div>

      <CartDrawer />
    </header>
  );
}
