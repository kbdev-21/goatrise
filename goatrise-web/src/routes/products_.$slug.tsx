import { Fragment } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { isAxiosError } from "axios";

import { productBySlugQueryOptions } from "@/api/product/query-hooks";
import { ProductDetailView } from "@/components/shared/product-detail";
import { RelatedProducts } from "@/components/shared/related-products";
import { localizePath, localized } from "@/i18n";
import { SITE_NAME, jsonLd, seo, toAbsoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/products_/$slug")({
  loader: async ({ context: { queryClient }, params: { slug } }) => {
    try {
      const product = await queryClient.ensureQueryData(
        productBySlugQueryOptions(slug)
      );
      // sản phẩm đã tắt bán thì coi như không tồn tại (trả 404, không để bị index)
      if (!product.isActive) {
        throw notFound();
      }
      return product;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  head: ({ match, loaderData: product }) => {
    if (!product) {
      return {};
    }

    const { locale } = match.context;
    const title = localized(product.title, locale);
    const description = localized(product.shortDescription, locale);
    const path = `/products/${product.slug}`;
    const images = product.imgUrls ?? [];
    // cùng cách lấy giá hiển thị với trang chi tiết
    const price = product.displayPrice ?? product.items.at(0)?.price ?? null;
    const inStock = product.items.some(
      (item) => item.isActive && item.stock > 0
    );
    const url = toAbsoluteUrl(localizePath(path, locale));

    return seo({
      locale,
      title,
      description,
      path,
      image: images.at(0),
      type: "product",
      extraMeta: [
        // giá khai báo cho máy tìm kiếm luôn là VND: đơn hàng thanh toán bằng VND, USD chỉ là giá quy đổi
        ...(price !== null
          ? [
              { property: "product:price:amount", content: String(price) },
              { property: "product:price:currency", content: "VND" },
            ]
          : []),
        // structured data để Google hiện tên / giá / tình trạng hàng ngay trên kết quả tìm kiếm
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Product",
          name: title,
          description,
          image: images,
          brand: { "@type": "Brand", name: SITE_NAME },
          ...(price !== null
            ? {
                offers: {
                  "@type": "Offer",
                  price,
                  priceCurrency: "VND",
                  availability: inStock
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  ...(url ? { url } : {}),
                },
              }
            : {}),
        }),
      ],
    });
  },
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
