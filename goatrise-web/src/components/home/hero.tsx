import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { hero } from "./placeholder-data";

export function Hero() {
  return (
    <section className="relative -mt-18 aspect-[4/5] w-full overflow-hidden bg-black md:aspect-[2/1]">
      <img
        src={hero.image}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10"
      />

      <div className="relative flex size-full flex-col justify-end px-6 pb-16 md:pb-20 lg:px-10">
        <div className="max-w-xl text-white">
          <h1 className="text-xl leading-[1.05] font-semibold tracking-tight whitespace-pre-line uppercase sm:text-2xl lg:text-3xl">
            {hero.title}
          </h1>
          <p className="mt-2 max-w-sm font-serif text-xs leading-relaxed text-white/85">
            {hero.description}
          </p>

          <Button
            asChild
            variant="outline"
            className="mt-4 h-8 rounded-none border-white bg-white px-6 text-[0.65rem] font-medium tracking-[0.2em] text-black uppercase hover:bg-transparent hover:text-white"
          >
            <Link to="/products">{hero.ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
