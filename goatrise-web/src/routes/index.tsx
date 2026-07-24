import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import heroImg from "@/assets/hero.jpg";
import { productsQueryOptions } from "@/api/product/query-hooks";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";

const BEST_SELLER_LIMIT = 5;

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(productsQueryOptions());
  },
  component: App,
});

function App() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());

  // TODO: chuyển sang endpoint best-sellers khi backend hỗ trợ sort/filter
  const bestSellers = products
    .filter((product) => product.isActive)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, BEST_SELLER_LIMIT);

  return (
    <>
      <section className="relative h-[calc(100svh-4rem)] w-full overflow-hidden">
        <img
          src={heroImg}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />

        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/60"
        />

        <div className="relative flex size-full flex-col items-center justify-end px-6 pb-16 text-center text-white md:pb-24">
          <p className="text-xs font-semibold tracking-[0.25em] text-white/80 uppercase">
            1st Collection · 2026
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl leading-[0.95] font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
            Real improvements start everyday
          </h1>

          <Button
            asChild
            variant="outline"
            className="mt-10 h-12 rounded-none border-white/70 bg-transparent px-8 text-xs font-bold tracking-widest text-white uppercase hover:bg-white hover:text-black"
          >
            <Link to="/products">Khám phá bộ sưu tập</Link>
          </Button>
        </div>
      </section>

      <section className="px-6 py-16 lg:px-10">
        <div className="flex items-end justify-between gap-6 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              Được mua nhiều nhất
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight uppercase lg:text-3xl">
              Best sellers
            </h2>
          </div>

          <Link
            to="/products"
            className="shrink-0 pb-1 text-xs font-bold tracking-widest text-foreground/70 uppercase underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Xem tất cả
          </Link>
        </div>

        {bestSellers.length === 0 ? (
          <p className="mt-6 font-serif text-sm text-muted-foreground">
            Chưa có sản phẩm nào.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 xl:grid-cols-5">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
