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
  const headerRef = useRef<HTMLElement>(null);

  const isHome = useRouterState({
    select: (s) => s.location.pathname === "/",
  });
  // trang chủ mở ra là đang ở intro: giấu nội dung header ngay từ lần render đầu
  // (cả SSR), không để nó hiện ra rồi mới biến mất
  const [inIntro, setInIntro] = useState(isHome);
  const [overHero, setOverHero] = useState(isHome);
  const openCart = useCartStore((s) => s.openCart);
  const openSearch = useSearchStore((s) => s.openSearch);
  const cartCount = useCartStore(selectItemCount);
  // chỉ hiện số thật sau khi rehydrate xong để server và client render giống nhau
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  useEffect(() => {
    // ngoài trang chủ: không có intro, không có hero => luôn hiện, nền trắng
    if (!isHome) {
      setInIntro(false);
      setOverHero(false);
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;

      // intro [data-header-hide] còn ghim (đáy section chưa lên tới đáy khung
      // dính) thì giấu nội dung header. So với chính khung dính (100svh) chứ không
      // so với innerHeight, để khớp đúng mốc intro nhả trên mobile.
      // Vừa chuyển sang trang chủ, trang cũ có thể chưa nhả DOM => chưa thấy
      // intro thì coi như đang ở intro (vào trang chủ luôn ở đầu trang)
      const intro = document.querySelector<HTMLElement>("[data-header-hide]");
      const stage = intro?.querySelector<HTMLElement>("[data-intro-stage]");
      setInIntro(
        !intro ||
          !stage ||
          intro.getBoundingClientRect().bottom > stage.offsetHeight + 1
      );

      // header còn nằm trên hero [data-header-zone] thì trong suốt
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const zone = document.querySelector<HTMLElement>("[data-header-zone]");
      setOverHero(
        zone !== null && zone.getBoundingClientRect().bottom >= headerHeight
      );
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

  // state chỉ được effect cập nhật sau khi vẽ; chặn thêm bằng isHome để frame
  // đầu tiên sau khi rời trang chủ không mang trạng thái cũ
  const introHidden = isHome && inIntro;
  // trong suốt khi còn ở intro hoặc header còn nằm trên hero tối của trang chủ
  const transparent = isHome && (inIntro || overHero);
  const count = hasHydrated ? cartCount : 0;
  const cartLabel =
    count > 0 ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng, đang trống";

  return (
    // right: Radix khóa cuộn thì scrollbar biến mất, body bù lại bằng margin-right
    // và đặt --removed-body-scroll-bar-size; header fixed phải lùi theo, không
    // thì giãn rộng ra làm logo / nút bên phải xô sang phải
    <header
      ref={headerRef}
      className={cn(
        "header-shell fixed top-0 right-[var(--removed-body-scroll-bar-size,0px)] left-0 z-40 border-b",
        transparent
          ? "border-transparent bg-transparent text-white"
          : "border-border bg-background/100 text-foreground backdrop-blur-xl"
      )}
      data-intro={introHidden ? "" : undefined}
      // dùng bàn phím tab vào header thì luôn hiện ra, kể cả đang ở intro
      onFocusCapture={() => setInIntro(false)}
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
