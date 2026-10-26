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
import { useFormatPrice, useT } from "@/i18n";
import { selectItemCount, selectSubtotal, useCartStore } from "@/stores/cart.store";

export function CartDrawer() {
  const t = useT();
  const formatPrice = useFormatPrice();
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
            {t.cart.title(count)}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t.cart.description}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingCart className="size-8 text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">{t.cart.empty}</p>
            <Button
              variant="outline"
              onClick={closeCart}
              className="h-11 rounded-none px-8 text-xs font-bold tracking-widest uppercase"
            >
              {t.common.continueShopping}
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
                  {t.cart.unavailableWarning}
                </p>
              ) : null}

              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold tracking-widest uppercase">
                  {t.order.subtotal}
                </span>
                <span className="text-base font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t.cart.shippingNote}
              </p>

              <Button
                onClick={() => {
                  closeCart();
                  void navigate({ to: "/checkout" });
                }}
                className="mt-5 h-12 w-full rounded-none bg-foreground text-xs font-bold tracking-widest text-background uppercase hover:bg-foreground/90"
              >
                {t.cart.checkout}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
