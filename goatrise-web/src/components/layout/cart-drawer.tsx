import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";

import { productsQueryOptions } from "@/api/product/query-hooks";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartLineItem } from "@/components/shared/cart-line-item";
import { formatPrice } from "@/lib/utils";
import { selectItemCount, selectSubtotal, useCartStore } from "@/stores/cart.store";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const setOpen = useCartStore((s) => s.setOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);
  const syncFromProducts = useCartStore((s) => s.syncFromProducts);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const navigate = useNavigate();

  // Revalidate: chỉ fetch khi drawer mở; tái dùng query có sẵn nên không cần endpoint mới
  const { data: products } = useQuery({
    ...productsQueryOptions(),
    enabled: isOpen && lines.length > 0,
  });

  useEffect(() => {
    if (hasHydrated && products) {
      syncFromProducts(products);
    }
  }, [hasHydrated, products, syncFromProducts]);

  const hasUnavailable = lines.some((line) => !line.isAvailable);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-[min(28rem,100vw)] gap-0 p-0 data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border p-6">
          <SheetTitle className="text-sm font-bold tracking-widest uppercase">
            Giỏ hàng{count > 0 ? ` (${count})` : ""}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Danh sách sản phẩm đang có trong giỏ hàng
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingCart className="size-8 text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
            <Button
              variant="outline"
              onClick={closeCart}
              className="h-11 rounded-none px-8 text-xs font-bold tracking-widest uppercase"
            >
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {[...lines]
                .sort((a, b) => b.addedAt - a.addedAt)
                .map((line) => (
                  <CartLineItem
                    key={line.itemId}
                    line={line}
                    onNavigate={closeCart}
                  />
                ))}
            </div>

            <div className="border-t border-border p-6">
              {hasUnavailable ? (
                <p className="mb-3 text-xs text-destructive">
                  Một vài sản phẩm không còn khả dụng, vui lòng xoá khỏi giỏ trước khi
                  thanh toán.
                </p>
              ) : null}

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold tracking-widest uppercase">
                  Tạm tính
                </span>
                <span className="text-base font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Phí vận chuyển được tính ở bước thanh toán.
              </p>

              <Button
                onClick={() => {
                  closeCart();
                  void navigate({ to: "/checkout" });
                }}
                className="mt-5 h-12 w-full rounded-none bg-foreground text-xs font-bold tracking-widest text-background uppercase hover:bg-foreground/90"
              >
                Thanh toán
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
