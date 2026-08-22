import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import type { Product } from "@/api/product/api";
import { cn } from "@/lib/utils";

const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const images = product.imgUrls ?? [];
  const hoverImage = images[1]; // ảnh thứ 2 fade lên khi hover (nếu có)

  const price = product.displayPrice ?? product.items[0]?.price ?? null;
  const colors = [
    ...new Set(
      [...product.items]
        .sort((a, b) => b.displayPriority - a.displayPriority)
        .map((item) => item.attributeValues.COLOR)
        .filter((color): color is string => Boolean(color))
    ),
  ];

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className={cn("group block", className)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
        {images.length > 0 ? (
          <>
            {/* lớp nền: ảnh đầu, cố định, luôn đục 100% */}
            <img
              src={images[0]}
              alt={product.title.vi}
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
            {/* lớp trên: ảnh thứ 2, ẩn sẵn, fade hiện lên khi hover */}
            {hoverImage ? (
              <img
                src={hoverImage}
                alt={product.title.vi}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-400 ease-in-out group-hover:opacity-100"
              />
            ) : null}

            <span
              aria-hidden
              className="absolute right-3 bottom-3 flex size-8 items-center justify-center border-[0.5px] border-foreground/50 bg-background/90 text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              <Plus className="size-3.5" />
            </span>
          </>
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className="text-[0.8rem] font-medium tracking-wide uppercase">
          {product.title.vi}
        </h3>
        <p className="text-[0.8rem] text-muted-foreground">
          {price === null ? "Liên hệ" : priceFormatter.format(price)}
        </p>
        {colors.length > 0 ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            {colors.map((color) => (
              <span
                key={color}
                title={color}
                style={{ backgroundColor: color }}
                className="size-4 rounded-full ring-1 ring-foreground/30 ring-inset"
              />
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
