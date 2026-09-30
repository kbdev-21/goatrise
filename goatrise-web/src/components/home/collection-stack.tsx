import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import type { Collection } from "@/api/collection/api";
import { RollText } from "@/components/shared/roll-text";
import { useReveal } from "@/hooks/use-reveal";
import { useStackProgress } from "@/hooks/use-stack-progress";

export function CollectionStack({
  collections,
}: {
  collections: Collection[];
}) {
  const headingRef = useReveal<HTMLDivElement>();
  const stackRef = useStackProgress<HTMLDivElement>();

  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1500px] px-5 pb-20 lg:px-10 lg:pb-28">
      <div
        ref={headingRef}
        data-reveal
        className="flex items-end justify-between gap-6"
      >
        <h2 className="font-logo text-[clamp(1.5rem,4vw,2.75rem)] leading-none font-extrabold tracking-[-0.03em] uppercase">
          Collections
        </h2>

        <Link
          to="/collections"
          className="group shrink-0 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase opacity-55 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
        >
          <RollText label="Xem tất cả" />
        </Link>
      </div>

      {/* chồng thẻ: mỗi bộ sưu tập một thẻ dính gần full màn hình, thẻ sau trượt lên đè thẻ trước */}
      <div ref={stackRef} className="mt-10 flex flex-col gap-6">
        {collections.map((collection, index) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}

function CollectionCard({
  collection,
  index,
}: {
  collection: Collection;
  index: number;
}) {
  const title = collection.title.vi;

  return (
    <div
      className="stack-item sticky top-16 h-[calc(100svh-5rem)] md:top-[4.5rem] md:h-[calc(100svh-5.5rem)]"
      style={
        {
          "--i": index,
          // thẻ bị đè nghiêng xen kẽ trái / phải
          "--tilt": index % 2 === 0 ? "-2.5deg" : "2.5deg",
        } as CSSProperties
      }
    >
      <Link
        to="/collections/$id"
        params={{ id: collection.id }}
        className="stack-card group relative block size-full overflow-hidden bg-neutral-900 text-white"
      >
        {collection.imgUrl ? (
          <img
            src={collection.imgUrl}
            alt={title}
            loading="lazy"
            className="stack-media absolute inset-0 size-full object-cover"
          />
        ) : null}
        <div aria-hidden className="stack-shade absolute inset-0 bg-black" />

        <div className="relative flex h-full flex-col justify-end p-5 lg:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
            {/* tên trồi lên từ sau mặt nạ khi thẻ trượt vào vị trí */}
            <div className="overflow-hidden pb-[0.08em]">
              <h3 className="stack-title max-w-5xl font-logo text-[clamp(2.5rem,8vw,8rem)] leading-[0.85] font-extrabold tracking-[-0.05em] uppercase">
                {title}
              </h3>
            </div>

            {/* cùng kiểu nút với hero; cả thẻ là link nên hover đi theo group */}
            <span className="inline-flex h-11 w-fit shrink-0 items-center gap-3 border border-white/45 px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black group-focus-visible:border-white group-focus-visible:bg-white group-focus-visible:text-black">
              <RollText label="Xem bộ sưu tập" />
              <ArrowRight
                aria-hidden
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
