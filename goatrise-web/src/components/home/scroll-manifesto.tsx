import { useEffect, useRef } from "react";

import goatImg from "@/assets/d1-goat.jpg";
import introImg from "@/assets/goatrise-introduce.webp";
import menImg from "@/assets/men.jpg";
import womenImg from "@/assets/women.jpg";

/** Mỗi làn chạy một hướng và một tốc độ khác nhau => cảm giác lệch tầng. */
const LANES = [
  { dir: -1, speed: 1 },
  { dir: 1, speed: 1.7 },
  { dir: -1, speed: 0.6 },
] as const;

const MARQUEE_TOP = ["Real Improvement", "Start Everyday"];
const MARQUEE_BOTTOM = ["Bền bỉ", "Tối giản", "Tốt hơn mỗi ngày"];
const SHOTS = [goatImg, menImg, womenImg, introImg];

const IDLE_DRIFT = 0.02; // px mỗi ms, để làn không bao giờ chết cứng
const VELOCITY_EASE = 0.18;
const SHEAR_PER_PX = 0.4;
const SHEAR_MAX = 9; // độ

export function ScrollManifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const shearRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const shear = shearRef.current;
    if (!section || !shear) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const strips = stripRefs.current.filter(
      (strip): strip is HTMLDivElement => strip !== null
    );

    // Mỗi strip chứa nội dung nhân đôi => chỉ cần dịch trong 1 nửa rồi lặp lại.
    let widths = strips.map((strip) => strip.scrollWidth / 2);
    let frame = 0;
    let startTime = 0;
    let lastBase = 0;
    let velocity = 0;

    const measure = () => {
      widths = strips.map((strip) => strip.scrollWidth / 2);
    };

    const render = (time: number) => {
      if (!startTime) {
        startTime = time;
        lastBase = window.innerHeight - section.getBoundingClientRect().top;
      }

      // Quãng đường section đã đi qua viewport, cộng thêm chút trôi tự thân.
      const travel = window.innerHeight - section.getBoundingClientRect().top;
      const base = travel + (time - startTime) * IDLE_DRIFT;

      velocity += (base - lastBase - velocity) * VELOCITY_EASE;
      lastBase = base;

      const shearDeg = Math.max(
        -SHEAR_MAX,
        Math.min(SHEAR_MAX, velocity * SHEAR_PER_PX)
      );
      shear.style.transform = `skewX(${shearDeg.toFixed(2)}deg)`;

      strips.forEach((strip, i) => {
        const width = widths[i];
        if (!width) return;
        let x = (base * LANES[i].speed * LANES[i].dir) % width;
        if (x > 0) x -= width;
        strip.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      });

      frame = requestAnimationFrame(render);
    };

    // Chỉ chạy khi section thực sự nằm trong tầm nhìn.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !frame) {
          startTime = 0;
          frame = requestAnimationFrame(render);
        } else if (!entry.isIntersecting && frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "120px 0px" }
    );
    observer.observe(section);

    const resizeObserver = new ResizeObserver(measure);
    strips.forEach((strip) => resizeObserver.observe(strip));
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-foreground py-24 text-background md:py-32"
    >
      {/* Khối bị xé nghiêng theo vận tốc cuộn */}
      <div
        ref={shearRef}
        className="flex flex-col gap-4 will-change-transform md:gap-6"
      >
        <Lane ref={(el) => void (stripRefs.current[0] = el)}>
          <MarqueeText words={MARQUEE_TOP} />
        </Lane>

        <Lane ref={(el) => void (stripRefs.current[1] = el)}>
          <MarqueeShots />
        </Lane>

        <Lane ref={(el) => void (stripRefs.current[2] = el)}>
          <MarqueeText words={MARQUEE_BOTTOM} outlined />
        </Lane>
      </div>

      {/* Điểm đứng yên: mọi thứ trượt phía sau, riêng tấm này không nhúc nhích */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="pointer-events-auto max-w-xs bg-background px-8 py-7 text-center text-foreground shadow-[0_0_0_1px_var(--color-foreground)]">
          <p className="text-[0.6rem] font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Goat Rise · Est. 2026
          </p>
          <p className="mt-4 text-lg leading-[1.15] font-extrabold tracking-tight uppercase">
            Mọi thứ đều
            <br />
            chuyển động
          </p>
          <p className="mt-3 font-serif text-sm leading-relaxed text-foreground/70">
            Trừ tiêu chuẩn của chúng tôi.
          </p>
        </div>
      </div>
    </section>
  );
}

function Lane({
  children,
  ref,
}: {
  children: React.ReactNode;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="overflow-hidden">
      <div ref={ref} className="flex w-max will-change-transform">
        {children}
        <span aria-hidden className="flex">
          {children}
        </span>
      </div>
    </div>
  );
}

function MarqueeText({
  words,
  outlined,
}: {
  words: Array<string>;
  outlined?: boolean;
}) {
  return (
    <span
      className={`flex shrink-0 items-center text-[11vw] leading-[0.9] font-extrabold tracking-tight whitespace-nowrap uppercase ${
        outlined
          ? "text-transparent [-webkit-text-stroke:1px_currentColor]"
          : ""
      }`}
    >
      {words.map((word) => (
        <span key={word} className="flex shrink-0 items-center">
          {word}
          <span aria-hidden className="mx-[0.25em] text-[0.35em] opacity-50">
            ✳
          </span>
        </span>
      ))}
    </span>
  );
}

function MarqueeShots() {
  return (
    <span className="flex shrink-0 items-center gap-4 pr-4 md:gap-6 md:pr-6">
      {SHOTS.map((src) => (
        <span
          key={src}
          className="block h-[24vw] w-[34vw] shrink-0 overflow-hidden bg-background/10 md:h-[15vw] md:w-[22vw]"
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        </span>
      ))}
    </span>
  );
}
