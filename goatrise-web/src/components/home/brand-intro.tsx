import { FaInstagram } from "react-icons/fa6";

import introImg from "@/assets/goatrise-introduce.webp";

const INSTAGRAM_URL = "https://www.instagram.com/goatrise.vn/";

export function BrandIntro() {
  return (
    <section className="bg-muted">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-6 lg:grid-cols-2 lg:gap-8">
        {/* Cột trái: giới thiệu brand */}
        <div className="flex flex-col items-center justify-center py-16 text-center lg:py-0">
          <p className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Goat Rise · Est. 2026
          </p>

          <h2 className="mt-6 max-w-md text-3xl leading-[1.1] font-extrabold tracking-tight uppercase sm:text-4xl">
            Real Improvement
            <br />
            Start Everyday
          </h2>

          <span
            aria-hidden
            className="mt-8 block h-px w-10 bg-foreground/30"
          />

          <p className="mt-8 max-w-sm font-serif text-sm leading-relaxed text-foreground/70">
            Bền bỉ. Tối giản. Tốt hơn mỗi ngày.
          </p>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex h-11 items-center gap-2 border border-foreground px-8 text-[0.65rem] font-medium tracking-[0.2em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background"
          >
            <FaInstagram className="size-4" />
            Follow Us
          </a>
        </div>

        {/* Cột phải: ảnh full */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={introImg}
            alt="Goatrise"
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
