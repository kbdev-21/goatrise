import { createFileRoute } from "@tanstack/react-router";

import { productBySlugQueryOptions } from "@/api/product/query-hooks";
import { ProductDetailView } from "@/components/shared/product-detail";

export const Route = createFileRoute("/products_/$slug")({
  loader: ({ context: { queryClient }, params: { slug } }) =>
    queryClient.ensureQueryData(productBySlugQueryOptions(slug)),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const product = Route.useLoaderData();

  return <ProductDetailView product={product} />;
}
