import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { Collection } from "@/api/collection/api";
import { RollText } from "@/components/shared/roll-text";

const CTA_LABEL = "Shop now";

export function FeaturedCollections({
  collections,
}: {
  collections: Collection[];
}) {
  if (collections.length === 0) {
    return null;
  }

  // 1 collection: ảnh landscape (ngang) full-width; nhiều hơn: lưới ảnh dọc
  const isSingle = collections.length === 1;

  return (
    <section className="pb-20">
      <div
        className={cn(
          "grid grid-cols-1 gap-0",
          collections.length === 2 && "md:grid-cols-2",
          collections.length >= 3 && "md:grid-cols-3"
        )}
      >
        {collections.map((collection) => (
          <Link
            key={collection.id}
            to="/products"
            className={cn(
              "group relative block overflow-hidden bg-muted",
              isSingle ? "aspect-[16/9]" : "aspect-[4/5]"
            )}
          >
            {collection.imgUrl ? (
              <img
                src={collection.imgUrl}
                alt={collection.title.vi}
                loading="lazy"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}
            <div aria-hidden className="absolute inset-0 bg-black/25" />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-white">
              <h3 className="font-logo text-2xl font-semibold tracking-tight uppercase lg:text-3xl">
                {collection.title.vi}
              </h3>
              {/* cùng kiểu nút với hero; cả thẻ là link nên hover/focus đi theo group */}
              <span className="inline-flex h-11 items-center gap-3 border border-white/45 px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black group-focus-visible:border-white group-focus-visible:bg-white group-focus-visible:text-black">
                <RollText label={CTA_LABEL} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
