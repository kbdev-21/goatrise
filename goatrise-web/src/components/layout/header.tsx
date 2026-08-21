import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingCart, User } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Shop", to: "/" },
  { label: "Collections", to: "/products" },
  { label: "About Us", to: "/about" },
] as const;

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

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        transitionClass,
        transparent ? "bg-transparent" : "bg-background"
      )}
    >
      <div className="grid h-18 grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:px-10">
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className={cn(
                "text-[0.8rem] font-medium tracking-wide",
                transitionClass,
                textClass
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
            "flex items-center gap-7 justify-self-end",
            transitionClass,
            textClass
          )}
        >
          <button
            type="button"
            aria-label="Tìm kiếm"
            className="transition-opacity hover:opacity-60"
          >
            <Search className="size-[1.15rem]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Tài khoản"
            className="transition-opacity hover:opacity-60"
          >
            <User className="size-[1.15rem]" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Giỏ hàng"
            className="transition-opacity hover:opacity-60"
          >
            <ShoppingCart className="size-[1.15rem]" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
