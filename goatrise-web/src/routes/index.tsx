import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import heroImg from "@/assets/hero.jpg";
import { productsQueryOptions } from "@/api/product/query-hooks";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import type { Product } from "@/api/product/api";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    //return context.queryClient.ensureQueryData(productsQueryOptions());
    return [];
  },
  component: App,
});

function App() {
  //const { data: products } = useSuspenseQuery(productsQueryOptions());
  const products: Product[] = [];

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
        <h2 className="text-xl font-bold tracking-wide uppercase">
          Sản phẩm ({products.length})
        </h2>

        {products.length === 0 ? (
          <p className="mt-6 font-serif text-sm text-muted-foreground">
            Chưa có sản phẩm nào.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
