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
    </section>
  );
}
