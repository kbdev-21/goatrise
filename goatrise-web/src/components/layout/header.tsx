import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingCart, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { navItems } from "@/components/layout/nav-config";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const isHome = useRouterState({
    select: (s) => s.location.pathname === "/",
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Chỉ trong suốt khi ở đầu trang chủ (nơi có hero tối phía sau)
  const transparent = isHome && !scrolled;
  const textClass = transparent ? "text-white" : "text-foreground";
  const transitionClass = "transition-colors duration-500 ease-in-out";
  // Hover: gạch chân chạy từ trái (width 0 -> full) thay vì đổi màu
  const underlineClass =
    "relative after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        transitionClass,
        transparent ? "bg-transparent" : "bg-background"
      )}
    >
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:px-10">
        <div className="flex items-center gap-8">
          {/* Mobile: chỉ hiện nút Menu */}
          <MobileMenu
            triggerClassName={cn(
              "flex items-center md:hidden",
              underlineClass,
              transitionClass,
              textClass
            )}
          />
          {/* Desktop: hiện toàn bộ nav, ẩn nút Menu */}
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: true }}
                className={cn(
                  "text-[0.8rem] font-medium tracking-wide",
                  underlineClass,
                  transitionClass,
                  textClass
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          to="/"
          className={cn(
            "justify-self-center text-2xl font-extrabold tracking-tight uppercase",
            transitionClass,
            textClass
          )}
        >
          GOAT RISE
        </Link>

        <div
          className={cn(
            "flex items-center gap-4 justify-self-end md:gap-7",
            transitionClass,
            textClass
          )}
        >
          <button
            type="button"
            aria-label="Tìm kiếm"
            className={cn("flex items-center", underlineClass)}
          >
            <Search className="size-[1.15rem]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Tài khoản"
            className={cn("hidden items-center md:flex", underlineClass)}
          >
            <User className="size-[1.15rem]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Giỏ hàng"
            className={cn("flex items-center", underlineClass)}
          >
            <ShoppingCart className="size-[1.15rem]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
