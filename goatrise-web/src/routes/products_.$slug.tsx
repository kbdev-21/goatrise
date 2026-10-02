import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { productBySlugQueryOptions } from "@/api/product/query-hooks";
import { ProductDetailView } from "@/components/shared/product-detail";
import { RelatedProducts } from "@/components/shared/related-products";

export const Route = createFileRoute("/products_/$slug")({
  loader: ({ context: { queryClient }, params: { slug } }) =>
    queryClient.ensureQueryData(productBySlugQueryOptions(slug)),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const product = Route.useLoaderData();

  // chuyển sang sản phẩm khác (vd bấm sản phẩm liên quan) vẫn cùng route nên
  // React giữ nguyên component: key theo id để reset màu / size / số lượng
  // đã chọn và để useReveal quét lại lưới mới
  return (
    <Fragment key={product.id}>
      <ProductDetailView product={product} />
      <RelatedProducts product={product} />
    </Fragment>
  );
}
