import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { collectionsQueryOptions } from "@/api/collection/query-hooks";

export const Route = createFileRoute("/collections")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(collectionsQueryOptions()),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: collections } = useSuspenseQuery(collectionsQueryOptions());

  // chỉ bộ sưu tập thật (type COLLECTION) đang bật, priority cao lên trước
  const visibleCollections = useMemo(
    () =>
      collections
        .filter(
          (collection) =>
            collection.isActive && collection.type === "COLLECTION"
        )
        .sort((a, b) => b.displayPriority - a.displayPriority),
    [collections]
  );

  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-10 pb-20 lg:px-10 lg:pt-16 lg:pb-28">
      <div className="flex items-end justify-between gap-6">
        <h1 className="font-logo text-[clamp(1.75rem,5vw,3.5rem)] leading-none font-extrabold tracking-[-0.03em] uppercase">
          Bộ sưu tập
        </h1>
        <p className="shrink-0 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase tabular-nums opacity-55">
          {visibleCollections.length} bộ sưu tập
        </p>
      </div>

      {visibleCollections.length === 0 ? (
        <p className="mt-8 border-t border-border py-24 text-center text-sm text-muted-foreground">
          Chưa có bộ sưu tập nào.
        </p>
      ) : (
        // mỗi bộ sưu tập một hàng, ảnh ngang full-width, chữ đè góc dưới
        <div className="mt-8 flex flex-col gap-4 border-t border-border pt-8 lg:gap-6">
          {visibleCollections.map((collection) => (
            <Link
              key={collection.id}
              to="/collections/$id"
              params={{ id: collection.id }}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-black text-white sm:aspect-[16/9] lg:aspect-[21/9]"
            >
              {collection.imgUrl ? (
                <img
                  src={collection.imgUrl}
                  alt={collection.title.vi}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : null}
              {/* phủ tối từ dưới lên để chữ trắng luôn đọc được */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-10">
                <h2 className="font-logo text-[clamp(1.5rem,3.5vw,2.75rem)] leading-[0.95] font-extrabold tracking-[-0.03em] uppercase">
                  {collection.title.vi}
                </h2>
                {collection.shortDescription.vi ? (
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">
                    {collection.shortDescription.vi}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
