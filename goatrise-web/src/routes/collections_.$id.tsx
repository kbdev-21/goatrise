import { useMemo } from "react";
import type { CSSProperties } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import { collectionQueryOptions } from "@/api/collection/query-hooks";
import { ProductCard } from "@/components/shared/product-card";
import { Reveal } from "@/components/shared/reveal";

export const Route = createFileRoute("/collections_/$id")({
  loader: async ({ context: { queryClient }, params: { id } }) => {
    try {
      const collection = await queryClient.ensureQueryData(
        collectionQueryOptions(id)
      );
      // bộ sưu tập đã tắt thì coi như không tồn tại
      if (!collection.isActive) {
        throw notFound();
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  component: CollectionDetailPage,
});

function CollectionDetailPage() {
  const { id } = Route.useParams();
  const { data: collection } = useSuspenseQuery(collectionQueryOptions(id));

  const products = useMemo(
    () =>
      collection.products
        .filter((product) => product.isActive)
        .sort((a, b) => b.displayPriority - a.displayPriority),
    [collection.products]
  );

  return (
    <>
      {/* Hero: ảnh bộ sưu tập, chữ nằm góc dưới */}
      <section className="relative h-[70svh] min-h-[28rem] w-full overflow-hidden bg-black text-white">
        {collection.imgUrl ? (
          <img
            src={collection.imgUrl}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
        {/* phủ tối từ dưới lên để chữ trắng luôn đọc được */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10"
        />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1500px] flex-col justify-end px-5 pb-12 lg:px-10 lg:pb-16">
          {/* nằm ngay màn đầu nên chạy bằng CSS animation lúc tải trang, không chờ JS */}
          <Link
            to="/collections"
            className="rise-fade w-fit text-[11px] font-bold tracking-[0.18em] text-white/70 uppercase transition-colors hover:text-white"
            style={{ "--rise-delay": "100ms" } as CSSProperties}
          >
            Bộ sưu tập
          </Link>
          <h1
            className="rise-fade mt-3 font-logo text-[clamp(2rem,5vw,3.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase"
            style={{ "--rise-delay": "200ms" } as CSSProperties}
          >
            {collection.title.vi}
          </h1>
          {collection.shortDescription.vi ? (
            <p
              className="rise-fade mt-4 max-w-md text-sm leading-relaxed text-white/75"
              style={{ "--rise-delay": "300ms" } as CSSProperties}
            >
              {collection.shortDescription.vi}
            </p>
          ) : null}
        </div>
      </section>

      {/* Sản phẩm của bộ sưu tập */}
      <section className="mx-auto max-w-[1500px] px-5 py-16 lg:px-10 lg:py-24">
        <Reveal>
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase tabular-nums opacity-55">
            {products.length} sản phẩm
          </p>
        </Reveal>

        {products.length === 0 ? (
          <Reveal>
            <p className="py-24 text-center text-sm text-muted-foreground">
              Bộ sưu tập này chưa có sản phẩm nào.
            </p>
          </Reveal>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
            {products.map((product, index) => (
              // mỗi thẻ tự quan sát: đổi sang bộ sưu tập khác vẫn cùng route, lưới mới vẫn hiện được
              <Reveal key={product.id} delay={(index % 4) * 60}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
