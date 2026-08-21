import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { productsQueryOptions } from "@/api/product/query-hooks";
import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { BestSellers } from "@/components/home/best-sellers";
import { BrandIntro } from "@/components/home/brand-intro";

const BEST_SELLER_LIMIT = 8;

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(productsQueryOptions()),
  component: App,
});

function App() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());

  const bestSellers = products
    .filter((product) => product.isActive)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, BEST_SELLER_LIMIT);

  return (
    <>
      <Hero />
      <BestSellers products={bestSellers} />
      <FeaturedCollections />
      <BrandIntro />
    </>
  );
}
