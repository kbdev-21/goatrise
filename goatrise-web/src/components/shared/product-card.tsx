import { Link } from "@tanstack/react-router";

import type { Product } from "@/api/product/api";

const priceFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: { product: Product }) {
  const price = product.displayPrice ?? product.items[0]?.price ?? null;
  const hasDiscount =
    product.comparePrice !== null && price !== null && product.comparePrice > price;
  const colors = [
    ...new Set(
      product.items
        .map((item) => item.attributeValues.COLOR)
        .filter((color): color is string => Boolean(color))
    ),
  ];

  return (
    <Link to="/products" className="group block">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {product.imgUrls?.[0] ? (
          <img
            src={product.imgUrls[0]}
            alt={product.title.vi}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-bold tracking-wide uppercase">
          {product.title.vi}
        </h3>
        <p className="pt-1 text-sm font-medium">
          {price === null ? (
            <span className="text-muted-foreground">Liên hệ</span>
          ) : (
            <>
              {priceFormatter.format(price)}
              {hasDiscount ? (
                <span className="ml-2 font-normal text-muted-foreground line-through">
                  {priceFormatter.format(product.comparePrice!)}
                </span>
              ) : null}
            </>
          )}
        </p>
        {colors.length > 0 ? (
          <div className="flex items-center gap-1.5 pt-1">
            {colors.map((color) => (
              <span
                key={color}
                title={color}
                style={{ backgroundColor: color }}
                className="size-5 rounded-full ring-1 ring-foreground ring-inset"
              />
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
