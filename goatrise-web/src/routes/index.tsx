import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { productsQueryOptions } from "@/api/product/query-hooks";
import { collectionsQueryOptions } from "@/api/collection/query-hooks";
import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { FeaturedProducts } from "@/components/home/featured-products";
import { BrandIntro } from "@/components/home/brand-intro";

const FEATURED_PRODUCT_LIMIT = 8;
const FEATURED_CATEGORY_LIMIT = 2;

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

  // tạm lấy sản phẩm bán chạy nhất làm featured
  const featuredProducts = products
    .filter((product) => product.isActive)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, FEATURED_PRODUCT_LIMIT);

  // collection đang bật + featured, priority cao lên trước
  const featured = collections
    .filter((collection) => collection.isActive && collection.isFeatured)
    .sort((a, b) => b.displayPriority - a.displayPriority);

  // hero: COLLECTION featured đứng đầu; khối dưới: 2 CATEGORY featured đầu
  const heroCollection = featured.find(
    (collection) => collection.type === "COLLECTION"
  );
  const featuredCategories = featured
    .filter((collection) => collection.type === "CATEGORY")
    .slice(0, FEATURED_CATEGORY_LIMIT);

  return (
    <>
      <Hero collection={heroCollection} />

      <FeaturedProducts products={featuredProducts} />
      <FeaturedCollections collections={featuredCategories} />
      <BrandIntro />
    </>
  );
}
