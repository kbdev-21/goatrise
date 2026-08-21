import { Link } from "@tanstack/react-router";

import { featuredCollections } from "./placeholder-data";

export function FeaturedCollections() {
  return (
    <section className="px-6 pb-20 lg:px-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {featuredCollections.map((collection) => (
          <Link
            key={collection.id}
            to="/products"
            className="group relative block aspect-[4/5] overflow-hidden bg-muted"
          >
            <img
              src={collection.image}
              alt={collection.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
            />

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-8 text-white">
              <h3 className="text-xl font-semibold tracking-tight uppercase lg:text-2xl">
                {collection.title}
              </h3>
              <span className="bg-white px-8 py-2.5 text-[0.65rem] font-medium tracking-[0.2em] text-black uppercase transition-colors group-hover:bg-black group-hover:text-white">
                {collection.ctaLabel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
