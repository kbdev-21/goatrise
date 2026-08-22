import { Link } from "@tanstack/react-router";

import type { Product } from "@/api/product/api";
import { ProductCard } from "@/components/shared/product-card";

export function BestSellers({ products }: { products: Product[] }) {
  return (
    <section className="px-6 py-16 lg:px-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold tracking-tight uppercase lg:text-2xl">
          Best Sellers
        </h2>
        <Link
          to="/products"
          className="border border-border px-3 py-1.5 text-[0.65rem] font-medium tracking-[0.15em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background"
        >
          Xem tất cả
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 font-serif text-sm text-muted-foreground">
          Chưa có sản phẩm nào.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-5">
          {products.slice(0, 5).map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              className={index === 4 ? "hidden 2xl:block" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
