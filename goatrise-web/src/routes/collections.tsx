import { useMemo } from "react";
import type { CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { collectionsQueryOptions } from "@/api/collection/query-hooks";
import type { Collection } from "@/api/collection/api";
import { RollText } from "@/components/shared/roll-text";
import { useReveal } from "@/hooks/use-reveal";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { cn } from "@/lib/utils";

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
        // kiểu editorial: ảnh lớn xen kẽ trái / phải, chữ bám đáy ở cột còn lại
        <div className="mt-8 flex flex-col gap-20 border-t border-border pt-10 lg:gap-36 lg:pt-16">
          {visibleCollections.map((collection, index) => (
            <CollectionRow
              key={collection.id}
              collection={collection}
              reversed={index % 2 === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionRow({
  collection,
  reversed,
}: {
  collection: Collection;
  reversed: boolean;
}) {
  const rowRef = useReveal<HTMLAnchorElement>();
  // ảnh trôi chậm hơn trang khi cuộn, cùng kiểu với ảnh cuối BrandIntro
  const mediaRef = useScrollProgress<HTMLDivElement>();

  return (
    <Link
      ref={rowRef}
      to="/collections/$id"
      params={{ id: collection.id }}
      className="group grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-10"
    >
      <div
        ref={mediaRef}
        data-reveal
        className={cn(
          "relative aspect-[4/5] overflow-hidden bg-muted sm:aspect-[3/2] lg:col-span-7 lg:row-start-1 lg:aspect-[5/4]",
          reversed && "lg:col-start-6"
        )}
      >
        {collection.imgUrl ? (
          <img
            src={collection.imgUrl}
            alt={collection.title.vi}
            loading="lazy"
            className="absolute inset-0 size-full scale-[1.14] object-cover transition-[scale] duration-700 ease-out group-hover:scale-[1.2]"
            style={{ translate: "0 calc((var(--p, 0.5) - 0.5) * -8%)" }}
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/25"
        />
      </div>

      <div
        data-reveal
        style={{ "--reveal-delay": "120ms" } as CSSProperties}
        className={cn(
          "flex flex-col gap-5 lg:col-span-4 lg:row-start-1 lg:pb-4",
          reversed ? "lg:col-start-1" : "lg:col-start-9"
        )}
      >
        {/* năm lấy từ createdAt (collection chưa có trường year riêng) */}
        <p className="text-base font-bold tracking-[0.14em] tabular-nums opacity-55 lg:text-lg">
          {new Date(collection.createdAt).getFullYear()}
        </p>

        <h2 className="font-logo text-[clamp(2rem,4.5vw,4rem)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase">
          {collection.title.vi}
        </h2>

        {collection.shortDescription.vi ? (
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {collection.shortDescription.vi}
          </p>
        ) : null}

        {/* cùng kiểu nút với hero, bản nền sáng; cả hàng là link nên hover đi theo group */}
        <span className="mt-2 inline-flex h-11 w-fit items-center gap-3 border border-border px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background group-focus-visible:border-foreground group-focus-visible:bg-foreground group-focus-visible:text-background">
          <RollText label="Xem bộ sưu tập" />
          <ArrowRight
            aria-hidden
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  );
}
