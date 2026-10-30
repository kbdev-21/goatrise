import { Fragment } from "react";
import type { CSSProperties } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FaInstagram } from "react-icons/fa6";

import courtImg from "@/assets/d1-goat.jpg";
import womenImg from "@/assets/women.jpg";
import { Reveal } from "@/components/shared/reveal";
import { RollText } from "@/components/shared/roll-text";
import { INSTAGRAM_URL } from "@/constant/social";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { getMessages, useT } from "@/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: ({ match }) => {
    const { locale } = match.context;
    const t = getMessages(locale);
    return seo({
      locale,
      title: t.seo.about.title,
      description: t.seo.about.description,
      path: "/about",
    });
  },
  component: AboutPage,
});

/**
 * Trang giới thiệu bản ngắn: trang chủ đã kể brand đủ nhiều nên ở đây chỉ còn
 * câu chuyện 2 đoạn, cặp ảnh editorial và lời kết dẫn sang sản phẩm.
 */
function AboutPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-10 pb-20 lg:px-10 lg:pt-16 lg:pb-28">
      {/* nằm ngay màn đầu nên chạy bằng CSS animation lúc tải trang, không chờ JS */}
      <header>
        <p
          className="rise-fade text-[11px] font-bold tracking-[0.18em] uppercase opacity-55"
          style={{ "--rise-delay": "100ms" } as CSSProperties}
        >
          {t.about.eyebrow}
        </p>
        <h1
          className="rise-fade mt-3 font-logo text-[clamp(2rem,5vw,3.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase"
          style={{ "--rise-delay": "200ms" } as CSSProperties}
        >
          {t.about.title}
        </h1>
      </header>

      {/* Câu chuyện: tagline lớn bên trái, 2 đoạn ngắn bên phải */}
      <section className="mt-8 grid grid-cols-1 gap-8 border-t border-border pt-10 lg:grid-cols-12 lg:gap-10 lg:pt-16">
        <Reveal className="lg:col-span-5">
          <h2 className="font-logo text-[clamp(1.75rem,4vw,3rem)] leading-[0.95] font-extrabold tracking-[-0.03em] uppercase">
            {t.about.heading.map((line, index) => (
              <Fragment key={line}>
                {index > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </h2>
        </Reveal>
        <Reveal
          delay={120}
          className="flex max-w-xl flex-col gap-5 text-base leading-relaxed font-light lg:col-span-6 lg:col-start-7"
        >
          {t.about.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
      </section>

      {/* Cặp ảnh dọc so le, kiểu editorial */}
      <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:mt-28 lg:gap-10">
        <AboutImage src={courtImg} alt={t.about.imageAlt[0]} />
        <AboutImage
          src={womenImg}
          alt={t.about.imageAlt[1]}
          delay={120}
          className="mt-12 sm:mt-20 lg:mt-36"
        />
      </div>

      {/* Lời kết: gọi lại câu chào ở intro trang chủ, dẫn sang sản phẩm / Instagram */}
      <Reveal className="mt-20 flex flex-col items-center border-t border-border pt-16 text-center lg:mt-36 lg:pt-24">
        <p className="text-[11px] font-bold tracking-[0.18em] uppercase opacity-55">
          {t.about.closingEyebrow}
        </p>
        <p className="mt-4 font-logo text-[clamp(2rem,5vw,3.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase">
          {t.about.closingTitle}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/products"
            className="group inline-flex h-11 items-center gap-3 border border-foreground bg-foreground px-7 text-[11px] font-bold tracking-[0.18em] text-background uppercase transition-colors duration-300 hover:bg-transparent hover:text-foreground"
          >
            <RollText label={t.about.shop} />
            <ArrowRight
              aria-hidden
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-11 items-center gap-3 border border-border px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background"
          >
            <FaInstagram aria-hidden className="size-4" />
            <RollText label={t.about.follow} />
          </a>
        </div>
      </Reveal>
    </div>
  );
}

// ảnh hiện dần khi cuộn tới + trôi chậm hơn trang (cùng kiểu ảnh BrandIntro / Collections)
function AboutImage({
  src,
  alt,
  delay,
  className,
}: {
  src: string;
  alt: string;
  delay?: number;
  className?: string;
}) {
  const mediaRef = useScrollProgress<HTMLDivElement>();

  return (
    <Reveal delay={delay} className={className}>
      <div
        ref={mediaRef}
        className="relative aspect-[4/5] overflow-hidden bg-muted"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 size-full scale-[1.14] object-cover"
          style={{ translate: "0 calc((var(--p, 0.5) - 0.5) * -8%)" }}
        />
      </div>
    </Reveal>
  );
}
