import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingCart, User } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "@/components/layout/nav-config";

const actions = [
  { label: "Tìm kiếm", icon: Search },
  { label: "Đăng nhập", icon: User },
  { label: "Giỏ hàng", icon: ShoppingCart },
] as const;

export function MobileMenu({ triggerClassName }: { triggerClassName?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" aria-label="Menu" className={triggerClassName}>
          <Menu className="size-[1.15rem]" strokeWidth={1.75} />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[min(20rem,85vw)] p-0">
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="text-xl font-extrabold tracking-tight uppercase">
            GOAT RISE
          </SheetTitle>
        </SheetHeader>

        {/* Nav chính */}
        <nav className="flex flex-col">
          {navItems.map((item) => (
            <SheetClose key={item.to} asChild>
              <Link
                to={item.to}
                activeOptions={{ exact: true }}
                className="border-b border-border px-6 py-4 text-sm font-medium tracking-wide uppercase transition-colors hover:bg-muted data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        {/* Các action từ header */}
        <div className="mt-auto flex flex-col border-t border-border">
          {actions.map(({ label, icon: Icon }) => (
            <SheetClose key={label} asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-3 px-6 py-4 text-xs font-medium tracking-wide transition-colors hover:bg-muted"
                )}
              >
                <Icon className="size-[1.15rem]" strokeWidth={1.75} />
                {label}
              </button>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
