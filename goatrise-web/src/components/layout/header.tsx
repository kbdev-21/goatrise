import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, User } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Trang chủ", to: "/" },
  { label: "Sản phẩm", to: "/products" },
  { label: "Về chúng tôi", to: "/about" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:px-10">
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              className="text-sm font-bold tracking-wide uppercase transition-colors"
              activeProps={{ className: "text-foreground" }}
              inactiveProps={{
                className: "text-foreground/70 hover:text-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/"
          className="justify-self-center text-2xl font-extrabold tracking-tight uppercase"
        >
          Goatrise
        </Link>

        <div className="flex items-center gap-1 justify-self-end">
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-10 rounded-full"
            aria-label="Tìm kiếm"
          >
            <Search className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-10 rounded-full"
            aria-label="Tài khoản"
          >
            <User className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-10 rounded-full"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
