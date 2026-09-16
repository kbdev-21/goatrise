import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { productsQueryOptions } from "@/api/product/query-hooks";
import { collectionsQueryOptions } from "@/api/collection/query-hooks";
import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { BestSellers } from "@/components/home/best-sellers";
import { BrandIntro } from "@/components/home/brand-intro";

const BEST_SELLER_LIMIT = 8;
const FEATURED_COLLECTION_LIMIT = 3;

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions()),
      context.queryClient.ensureQueryData(collectionsQueryOptions()),
    ]),
  component: App,
});

function App() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const { data: collections } = useSuspenseQuery(collectionsQueryOptions());

  const bestSellers = products
    .filter((product) => product.isActive)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, BEST_SELLER_LIMIT);

  // Chỉ collection featured; priority cao lên trước; tối đa 3
  const featuredCollections = collections
    .filter((collection) => collection.isFeatured)
    .sort((a, b) => b.displayPriority - a.displayPriority)
    .slice(0, FEATURED_COLLECTION_LIMIT);

  return (
    <>
      <Hero />
      <BestSellers products={bestSellers} />
      <FeaturedCollections collections={featuredCollections} />
      <BrandIntro />
    </>
  );
}
