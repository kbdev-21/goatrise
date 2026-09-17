import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";

import type { Product } from "@/api/product/api";
import { ProductCard } from "@/components/shared/product-card";
import { RollText } from "@/components/shared/roll-text";
import { useReveal } from "@/hooks/use-reveal";

export function BestSellers({ products }: { products: Product[] }) {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28"
    >
      <div
        data-reveal
        className="flex items-end justify-between gap-6 border-b border-border pb-5"
      >
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
            (01)
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,5vw,3.25rem)] leading-none font-extrabold tracking-[-0.03em] uppercase">
            Best Sellers
          </h2>
        </div>

        <Link
          to="/products"
          className="group shrink-0 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase opacity-55 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
        >
          <RollText label="Xem tất cả" />
        </Link>
      </div>

      {products.length === 0 ? (
        <p data-reveal className="mt-10 text-sm text-muted-foreground">
          Chưa có sản phẩm nào.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              data-reveal
              // so le nhẹ để lưới không hiện ra cùng một lúc
              style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
