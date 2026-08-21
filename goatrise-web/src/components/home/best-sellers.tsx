import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { featuredReleases, type FeaturedRelease } from "./placeholder-data";

export function BestSellers() {
  return (
    <section className="px-6 py-16 lg:px-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold tracking-tight uppercase lg:text-2xl">
          Best Sellers
        </h2>
        <Link
          to="/products"
          className="border border-border px-3 py-1.5 text-[0.65rem] font-medium tracking-[0.15em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {featuredReleases.map((release) => (
          <ReleaseCard key={release.id} release={release} />
        ))}
      </div>
    </section>
  );
}

function ReleaseCard({ release }: { release: FeaturedRelease }) {
  return (
    <Link
      to="/products"
      className="group block w-[75%] shrink-0 snap-start sm:w-[45%] lg:w-[calc(25%-0.75rem)]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        <img
          src={release.image}
          alt={release.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {release.badge ? (
          <span className="absolute top-3 left-3 bg-background/90 px-2.5 py-1 text-[0.55rem] font-medium tracking-[0.15em] text-foreground uppercase">
            {release.badge}
          </span>
        ) : null}

        <span
          aria-hidden
          className="absolute right-3 bottom-3 flex size-9 items-center justify-center border border-foreground bg-background/90 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background"
        >
          <Plus className="size-4" />
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className="text-[0.8rem] font-medium tracking-wide uppercase">
          {release.name}
        </h3>
        <p className="text-[0.8rem] text-muted-foreground">{release.price}</p>
        {release.colors.length > 0 ? (
          <div className="flex items-center gap-1.5 pt-0.5">
            {release.colors.map((color) => (
              <span
                key={color}
                title={color}
                style={{ backgroundColor: color }}
                className="size-4 rounded-full ring-1 ring-foreground/30 ring-inset"
              />
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
