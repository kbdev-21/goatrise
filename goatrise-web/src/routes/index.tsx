import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { productsQueryOptions } from "@/api/product/query-hooks";
import { collectionsQueryOptions } from "@/api/collection/query-hooks";
import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { FeaturedProducts } from "@/components/home/featured-products";
import { CollectionStack } from "@/components/home/collection-stack";
import { BrandIntro } from "@/components/home/brand-intro";

const FEATURED_PRODUCT_LIMIT = 8;
const FEATURED_CATEGORY_LIMIT = 2;
// mỗi thẻ cao gần một màn hình, nhiều hơn thì trang chủ cuộn quá dài
const COLLECTION_STACK_LIMIT = 4;

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

  // sản phẩm đang bán, priority cao lên trước (cùng thứ tự "Nổi bật" ở /products)
  const featuredProducts = products
    .filter((product) => product.isActive)
    .sort((a, b) => b.displayPriority - a.displayPriority)
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

  // chồng thẻ: bộ sưu tập (type COLLECTION) đang bật, cùng thứ tự với trang /collections
  const stackCollections = collections
    .filter(
      (collection) => collection.isActive && collection.type === "COLLECTION"
    )
    .sort((a, b) => b.displayPriority - a.displayPriority)
    .slice(0, COLLECTION_STACK_LIMIT);

  return (
    <>
      <Hero collection={heroCollection} />

      <FeaturedProducts products={featuredProducts} />
      <FeaturedCollections collections={featuredCategories} />
      <CollectionStack collections={stackCollections} />
      <BrandIntro />
    </>
  );
}
