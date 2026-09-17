import { Fragment } from "react";
import type { CSSProperties } from "react";
import { FaInstagram } from "react-icons/fa6";

import introImg from "@/assets/goatrise-introduce.webp";
import { RollText } from "@/components/shared/roll-text";
import { useScrollProgress } from "@/hooks/use-scroll-progress";

const INSTAGRAM_URL = "https://www.instagram.com/goatrise.vn/";

const MANIFESTO =
  "GOAT RISE tin rằng tiến bộ thật sự không đến từ một cú bứt phá, mà từ những gì bạn lặp lại mỗi ngày. Chúng tôi làm quần áo cho nhịp đó: bền bỉ, tối giản, và tốt hơn một chút sau mỗi lần mặc.";

const WORDS = MANIFESTO.split(" ");

export function BrandIntro() {
  // chữ sáng dần theo tiến độ cuộn; tắt hiệu ứng thì sáng hết ngay
  const textRef = useScrollProgress<HTMLDivElement>({
    start: 0.2,
    end: 0.62,
    reducedValue: 1,
  });
  const mediaRef = useScrollProgress<HTMLDivElement>();

  return (
    <section className="border-t border-border">
      <div
        ref={textRef}
        className="mx-auto max-w-[1500px] px-5 py-24 lg:px-10 lg:py-36"
      >
        <p className="text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
          Goat Rise · Est. 2026
        </p>

        <p
          className="mt-8 max-w-4xl text-[clamp(1.25rem,3.2vw,2.5rem)] leading-[1.3] font-extrabold tracking-[-0.02em]"
          style={{ "--n": WORDS.length } as CSSProperties}
        >
          {WORDS.map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              <span
                className="manifesto-word"
                style={{ "--i": index } as CSSProperties}
              >
                {word}
              </span>{" "}
            </Fragment>
          ))}
        </p>

        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-12 inline-flex h-11 items-center gap-3 border border-foreground px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 hover:bg-foreground hover:text-background"
        >
          <FaInstagram aria-hidden className="size-4" />
          <RollText label="Follow Us" />
        </a>
      </div>

      {/* Kết bài: một tấm ảnh chạy hết bề ngang, chữ đứng yên ở giữa */}
      <div
        ref={mediaRef}
        className="relative aspect-[4/5] w-full overflow-hidden bg-muted sm:aspect-[16/9] lg:aspect-[21/9]"
      >
        <img
          src={introImg}
          alt="Goatrise"
          loading="lazy"
          className="absolute inset-0 size-full scale-[1.14] object-cover"
          style={{ translate: "0 calc((var(--p, 0.5) - 0.5) * -8%)" }}
        />
        <div aria-hidden className="absolute inset-0 bg-black/40" />

        <p className="absolute inset-0 grid place-items-center px-5 text-center text-[clamp(1.75rem,6vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.04em] text-white uppercase">
          <span>
            Real Improvement
            <br />
            Start Everyday
          </span>
        </p>
      </div>
    </section>
  );
}
