import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingCart } from "lucide-react";

import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { navItems } from "@/components/layout/nav-config";
import { RollText } from "@/components/shared/roll-text";
import { selectItemCount, useCartStore } from "@/stores/cart.store";
import { useSearchStore } from "@/stores/search.store";

// Bỏ qua rung lắc nhỏ của trackpad, chỉ đổi trạng thái khi thật sự đổi hướng
const DIRECTION_DELTA = 6;

const LABEL_CLASS =
  "text-[11px] font-bold tracking-[0.08em] whitespace-nowrap uppercase";
// Nút icon trên mobile: ô chạm 44x44, icon cùng cỡ với nút Menu
const ICON_CLASS =
  "flex size-11 items-center justify-center opacity-70 transition-opacity duration-300 hover:opacity-100";

const ACTION_CLASS = cn(
  LABEL_CLASS,
  "group -my-3 flex items-baseline gap-1.5 py-3 opacity-60 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
);

export function Header() {
  const [inTransparentZone, setInTransparentZone] = useState(true);
  const [hidden, setHidden] = useState(false);
  // bản sao của hidden để đọc trong vòng cập nhật cuộn (effect chỉ chạy lại khi đổi trang)
  const hiddenRef = useRef(false);
  const lastY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);

  const isHome = useRouterState({
    select: (s) => s.location.pathname === "/",
  });
  // trang chủ mở ra là đang ở intro: giấu nội dung header ngay từ lần render đầu
  // (cả SSR), không để nó hiện ra rồi mới biến mất
  const [inIntro, setInIntro] = useState(isHome);
  const openCart = useCartStore((s) => s.openCart);
  const openSearch = useSearchStore((s) => s.openSearch);
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

      // intro trang chủ [data-header-hide] còn ghim full màn hình (đáy chưa lên
      // tới đáy viewport) thì giấu nội dung header (data-intro). Header vẫn đứng
      // yên tại chỗ, không trượt đi: GOAT RISE của intro bay lên đúng chỗ logo
      // rồi trao tay, header mà đang trượt thì logo lệch
      const intro = document.querySelector<HTMLElement>("[data-header-hide]");
      const introActive =
        intro !== null &&
        intro.getBoundingClientRect().bottom > window.innerHeight + 1;
      setInIntro(introActive);
      if (introActive) {
        hiddenRef.current = false;
        setHidden(false);
        lastY.current = y;
        return;
      }

      // hero trang chủ đánh dấu [data-header-zone]: header còn nằm trên hero thì
      // luôn hiện và trong suốt, cuộn xuống cũng không giấu đi
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const zone = document.querySelector<HTMLElement>("[data-header-zone]");
      if (zone && zone.getBoundingClientRect().bottom >= headerHeight) {
        setInTransparentZone(true);
        hiddenRef.current = false;
        setHidden(false);
        lastY.current = y;
        return;
      }

      if (Math.abs(delta) < DIRECTION_DELTA) return;
      // cuộn xuống thì header trượt lên giấu đi ngay, cuộn lên là trượt ra lại.
      // y > 0: cú nảy cao su ở đỉnh trang (iOS) đi từ âm về 0 cũng là "delta > 0",
      // không được tính là cuộn xuống
      const hide = y > 0 && delta > 0;
      // đã qua hero thì đổi sang nền trắng, trừ frame header vừa bắt đầu trượt
      // lên (lúc đó nó đang hiện): giữ trong suốt để user chỉ thấy trượt đi,
      // không thấy vừa đổi màu vừa trượt; lần cập nhật sau nó đã ẩn mới đổi
      if (!hide || hiddenRef.current) setInTransparentZone(false);
      hiddenRef.current = hide;
      setHidden(hide);
      lastY.current = y;
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    // chiều cao màn hình đổi thì mốc hết hero cũng đổi theo
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // đổi trang (vào / rời trang chủ) có thể không phát sinh sự kiện cuộn nào,
    // chạy lại để tính ngay có đang ở intro không
  }, [isHome]);

  // Chỉ trong suốt khi header còn nằm trên hero tối của trang chủ
  const transparent = isHome && inTransparentZone;
  const count = hasHydrated ? cartCount : 0;
  const cartLabel =
    count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng, đang trống";

  return (
    <header
      ref={headerRef}
      className={cn(
        "header-shell fixed inset-x-0 top-0 z-40 border-b",
        hidden ? "-translate-y-full" : "translate-y-0",
        transparent
          ? "border-transparent bg-transparent text-white"
          : "border-border bg-background/100 text-foreground backdrop-blur-xl"
      )}
      data-intro={inIntro ? "" : undefined}
      // dùng bàn phím tab vào header thì luôn hiện ra, kể cả đang ở intro
      onFocusCapture={() => {
        hiddenRef.current = false;
        setHidden(false);
        setInIntro(false);
      }}
    >
      <div
        data-header-bar
        className="mx-auto grid h-14 w-full max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 md:h-16 lg:px-10"
      >
        <div className="flex items-center gap-5">
          {/* Mobile: chỉ hiện nút Menu */}
          <MobileMenu triggerClassName="-ml-3 flex size-11 items-center justify-center opacity-70 transition-opacity duration-300 hover:opacity-100 md:hidden" />

          {/* Desktop: hiện toàn bộ nav */}
          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
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

        {/* data-header-logo: intro trang chủ đo logo này để GOAT RISE bay tới đúng chỗ */}
        <Link
          to="/"
          data-header-logo
          aria-label="GOAT RISE — về trang chủ"
          className="-my-2 justify-self-center py-2 font-logo text-2xl font-extrabold uppercase md:text-3xl"
        >
          GOAT RISE
        </Link>

        <div className="flex items-center justify-self-end">
          {/* Mobile: icon cho gọn; Đăng nhập nằm trong menu mobile */}
          <div className="-mr-3 flex items-center md:hidden">
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={openSearch}
              className={ICON_CLASS}
            >
              <Search
                aria-hidden
                className="size-[1.15rem]"
                strokeWidth={1.75}
              />
            </button>

            <button
              type="button"
              aria-label={cartLabel}
              onClick={openCart}
              className={cn(ICON_CLASS, "relative")}
            >
              <ShoppingCart
                aria-hidden
                className="size-[1.15rem]"
                strokeWidth={1.75}
              />
              {count > 0 ? (
                <span
                  aria-hidden
                  className="absolute top-1.5 right-1 text-[10px] leading-none font-bold tabular-nums"
                >
                  {count > 99 ? "99+" : count}
                </span>
              ) : null}
            </button>
          </div>

          {/* Desktop: nhãn chữ */}
          <div className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={openSearch}
              className={ACTION_CLASS}
            >
              <RollText label="Tìm kiếm" />
            </button>

            <button
              type="button"
              aria-label="Đăng nhập"
              className={ACTION_CLASS}
            >
              <RollText label="Đăng nhập" />
            </button>

            <button
              type="button"
              aria-label={cartLabel}
              onClick={openCart}
              className={ACTION_CLASS}
            >
              <RollText label="Giỏ hàng" />
              {/* số lượng dạng (n), chặn ở 99+ cho gọn */}
              <span aria-hidden className="tabular-nums opacity-65">
                ({count > 99 ? "99+" : count})
              </span>
            </button>
          </div>
        </div>
      </div>

      <CartDrawer />
      <SearchOverlay />
    </header>
  );
}
