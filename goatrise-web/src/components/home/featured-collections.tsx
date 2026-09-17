import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Collection } from "@/api/collection/api";
import { RollText } from "@/components/shared/roll-text";
import { useReveal } from "@/hooks/use-reveal";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

const CTA_LABEL = "Shop now";

export function FeaturedCollections({
  collections,
}: {
  collections: Collection[];
}) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-border">
      {collections.map((collection, index) => (
        <CollectionRow
          key={collection.id}
          collection={collection}
          index={index}
        />
      ))}
    </section>
  );
}

/** Mỗi collection là một hàng biên tập: ảnh một bên, chữ một bên, đảo chiều so le. */
function CollectionRow({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const revealRef = useReveal<HTMLDivElement>();
  // ảnh trôi ngược chiều cuộn một chút để hàng có chiều sâu
  const mediaRef = useScrollProgress<HTMLDivElement>();
  const flipped = index % 2 === 1;
  const description = collection.shortDescription.vi;

  return (
    <div
      ref={revealRef}
      className="mx-auto grid max-w-[1500px] items-center gap-8 px-5 py-16 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-24"
    >
      <div
        ref={mediaRef}
        data-reveal
        className={cn(
          "relative aspect-[4/5] overflow-hidden bg-muted lg:aspect-[4/3]",
          flipped && "lg:order-2"
        )}
      >
        {/* link phụ trên ảnh, cùng đích với nút CTA nên ẩn khỏi bàn phím và screen reader */}
        <Link
          to="/products"
          tabIndex={-1}
          aria-hidden
          className="group absolute inset-0 block"
        >
          {collection.imgUrl ? (
            <img
              src={collection.imgUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full scale-[1.12] object-cover transition-transform duration-700 ease-smooth group-hover:scale-[1.18]"
              style={{ translate: "0 calc((var(--p, 0.5) - 0.5) * -6%)" }}
            />
          ) : null}
        </Link>
      </div>

      <div
        className={cn(
          "flex flex-col items-start",
          flipped && "lg:order-1 lg:pl-4"
        )}
      >
        <p
          data-reveal
          className="text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase"
        >
          ({String(index + 2).padStart(2, "0")})
        </p>

        <h3
          data-reveal
          style={{ "--reveal-delay": "80ms" } as CSSProperties}
          className="mt-4 text-[clamp(1.75rem,4.5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em] uppercase"
        >
          {collection.title.vi}
        </h3>

        {description ? (
          <p
            data-reveal
            style={{ "--reveal-delay": "140ms" } as CSSProperties}
            className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        ) : null}

        <div data-reveal style={{ "--reveal-delay": "200ms" } as CSSProperties}>
          <Link
            to="/products"
            aria-label={`${CTA_LABEL} — ${collection.title.vi}`}
            className="group mt-9 inline-flex h-11 items-center gap-3 border border-foreground px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 hover:bg-foreground hover:text-background"
          >
            <RollText label={CTA_LABEL} />
            <ArrowRight
              aria-hidden
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
