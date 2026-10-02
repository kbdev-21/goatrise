import { useMemo } from "react";
import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import type { Product, ProductDetail } from "@/api/product/api";
import type { CollectionBase } from "@/api/collection/api";
import { collectionQueryOptions } from "@/api/collection/query-hooks";
import { ProductCard } from "@/components/shared/product-card";
import { RollText } from "@/components/shared/roll-text";
import { useReveal } from "@/hooks/use-reveal";

const RELATED_LIMIT = 4;

/**
 * Sản phẩm liên quan: lấy từ danh mục (CATEGORY) của sản phẩm, không có thì
 * lấy collection đang bật đầu tiên. Backend chưa có endpoint riêng nên dùng
 * GET /api/collections/:id (products đã kèm items, đủ cho ProductCard).
 */
export function RelatedProducts({ product }: { product: ProductDetail }) {
  const source =
    product.collections.find((c) => c.isActive && c.type === "CATEGORY") ??
    product.collections.find((c) => c.isActive);

  // nằm dưới màn hình đầu nên fetch phía client, không chặn loader của trang
  const { data: collection } = useQuery({
    ...collectionQueryOptions(source?.id ?? ""),
    enabled: Boolean(source),
  });

  const related = useMemo(
    () =>
      (collection?.products ?? [])
        .filter((p) => p.isActive && p.id !== product.id)
        .sort((a, b) => b.displayPriority - a.displayPriority)
        .slice(0, RELATED_LIMIT),
    [collection?.products, product.id]
  );

  if (!source || related.length === 0) {
    return null;
  }

  return <RelatedGrid products={related} source={source} />;
}

// Tách riêng để useReveal chỉ chạy khi lưới đã có trong DOM: hook quét
// [data-reveal] một lần lúc mount, mount sớm lúc đang fetch sẽ không thấy gì
function RelatedGrid({
  products,
  source,
}: {
  products: Product[];
  source: CollectionBase;
}) {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="mx-auto max-w-[1500px] border-t border-border px-5 py-20 lg:px-10 lg:py-28"
    >
      <div data-reveal className="flex items-end justify-between gap-6">
        <h2 className="font-logo text-[clamp(1.5rem,4vw,2.75rem)] leading-none font-extrabold tracking-[-0.03em] uppercase">
          Có thể bạn cũng thích
        </h2>

        <Link
          to="/collections/$id"
          params={{ id: source.id }}
          className="group shrink-0 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase opacity-55 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
        >
          <RollText label="Xem tất cả" />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            data-reveal
            // so le nhẹ để lưới không hiện ra cùng một lúc
            style={{ "--reveal-delay": `${index * 60}ms` } as CSSProperties}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
