import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";

import { cn, formatPrice, getColorName } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";
import type { CartLine } from "@/stores/cart.store";

// sm: drawer (không gian hẹp) — lg: trang checkout
const SIZES = {
  sm: {
    row: "gap-4 p-6",
    image: "size-20",
    title: "text-xs",
    price: "text-xs",
  },
  lg: {
    row: "gap-5 p-5",
    image: "size-28",
    title: "text-sm",
    price: "text-sm",
  },
} as const;

export function CartLineItem({
  line,
  size = "sm",
  onNavigate,
  className,
}: {
  line: CartLine;
  size?: keyof typeof SIZES;
  onNavigate?: () => void;
  className?: string;
}) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);

  const styles = SIZES[size];
  const { snapshot } = line;
  const image = snapshot.imgUrl ?? snapshot.product?.imgUrls?.[0] ?? null;
  const color = snapshot.attributeValues.COLOR;
  const variant =
    [color ? getColorName(color) : null, snapshot.attributeValues.SIZE]
      .filter(Boolean)
      .join(" / ") || snapshot.sku;
  const lowStock =
    line.isAvailable && snapshot.stock > 0 && snapshot.stock < line.quantity;

  return (
    <div
      className={cn(
        "flex border-b border-border",
        styles.row,
        !line.isAvailable && "opacity-50",
        className
      )}
    >
      <div className={cn("shrink-0 overflow-hidden bg-muted", styles.image)}>
        {image ? (
          <img src={image} alt={snapshot.name} className="size-full object-cover" />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {snapshot.product ? (
              <Link
                to="/products/$slug"
                params={{ slug: snapshot.product.slug }}
                onClick={onNavigate}
                className={cn(
                  "block truncate font-medium tracking-wide uppercase hover:underline",
                  styles.title
                )}
              >
                {snapshot.product.title}
              </Link>
            ) : (
              <p
                className={cn(
                  "truncate font-medium tracking-wide uppercase",
                  styles.title
                )}
              >
                {snapshot.name}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">{variant}</p>
          </div>

          <button
            type="button"
            aria-label="Xoá khỏi giỏ hàng"
            onClick={() => removeLine(line.itemId)}
            className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {!line.isAvailable ? (
          <p className="mt-2 text-xs text-destructive">Sản phẩm không còn khả dụng</p>
        ) : lowStock ? (
          <p className="mt-2 text-xs text-destructive">
            Chỉ còn {snapshot.stock} sản phẩm
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <div className="flex h-8 w-[5.5rem] shrink-0 items-center justify-between border border-border">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => setQuantity(line.itemId, line.quantity - 1)}
              className="flex size-8 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Minus className="size-3" />
            </button>
            <span className="text-[11px] font-medium">{line.quantity}</span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => setQuantity(line.itemId, line.quantity + 1)}
              className="flex size-8 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-3" />
            </button>
          </div>

          <span
            className={cn("shrink-0 font-medium whitespace-nowrap", styles.price)}
          >
            {formatPrice(snapshot.price * line.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
