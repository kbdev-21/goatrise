import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { Collection } from "@/api/collection/api";

const CTA_LABEL = "Shop now";

export function FeaturedCollections({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) {
    return null;
  }

  // 1 collection: ảnh landscape (ngang) full-width; nhiều hơn: lưới ảnh dọc
  const isSingle = collections.length === 1;

  return (
    <section className="px-6 pb-20 lg:px-10">
      <div
        className={cn(
          "grid grid-cols-1 gap-4",
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
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
            />

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-8 text-white">
              <h3 className="text-xl font-semibold tracking-tight uppercase lg:text-2xl">
                {collection.title.vi}
              </h3>
              <span className="bg-white px-8 py-2.5 text-[0.65rem] font-medium tracking-[0.2em] text-black uppercase transition-colors group-hover:bg-black group-hover:text-white">
                {CTA_LABEL}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
