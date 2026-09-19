import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { hero } from "./placeholder-data";
import type { Collection } from "@/api/collection/api";
import { RollText } from "@/components/shared/roll-text";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

export function Hero({ collection }: { collection?: Collection }) {
  // --p chạy 0 → 1 trong đúng một màn hình cuộn đầu tiên
  const ref = useScrollProgress<HTMLElement>({ start: 0.5, end: 1 });

  // chưa có COLLECTION nào featured thì dùng tạm dữ liệu placeholder
  const title = collection?.title.vi ?? hero.title;
  const description = collection
    ? collection.shortDescription.vi
    : hero.description;
  const image = collection?.imgUrl ?? hero.image;

  return (
    <section
      ref={ref}
      className="relative -mt-12 h-[100svh] min-h-[34rem] w-full overflow-hidden bg-black text-white md:-mt-14"
    >
      {/* Ảnh trôi chậm hơn nội dung khi cuộn */}
      <div className="absolute inset-0">
        <img
          src={image}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
          style={{
            transform:
              "translate3d(0, calc(var(--p, 0) * 9%), 0) scale(calc(1 + var(--p, 0) * 0.08))",
          }}
        />
        {/* Tối dần khi cuộn để chữ ở khối kế tiếp không bị ảnh kéo sự chú ý */}
        <div
          aria-hidden
          className="absolute inset-0 bg-black"
          style={{ opacity: "calc(0.2 + var(--p, 0) * 0.45)" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1500px] flex-col justify-end px-5 pt-20 pb-12 lg:px-10 lg:pt-24 lg:pb-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-logo text-[clamp(2rem,5vw,3.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] whitespace-nowrap uppercase">
              {title}
            </h1>

            {description ? (
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
                {description}
              </p>
            ) : null}

            <div className="mt-6">
              <Link
                to="/products"
                className="group inline-flex h-11 items-center gap-3 border border-white/45 px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 hover:border-white hover:bg-white hover:text-black"
              >
                <RollText label={hero.ctaLabel} />
                <ArrowRight
                  aria-hidden
                  className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>

          {/* Gợi ý cuộn tĩnh, chỉ mờ dần khi người dùng bắt đầu cuộn */}
          <div
            aria-hidden
            className="hidden shrink-0 flex-col items-center gap-3 md:flex"
            style={{ opacity: "clamp(0, calc(1 - var(--p, 0) * 4), 1)" }}
          >
            <span className="text-[10px] font-bold tracking-[0.22em] text-white/60 uppercase">
              Scroll
            </span>
            <span className="block h-14 w-px bg-white/30" />
          </div>
        </div>
      </div>
    </section>
  );
}
