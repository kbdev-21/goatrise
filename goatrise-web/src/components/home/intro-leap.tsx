import type { ReactNode } from "react";

import { useIntroScroll } from "@/hooks/use-intro-scroll";

const GREETING = ["Hey", "Goat,", "Ready", "to", "Rise?"];

/**
 * Màn mở đầu trang chủ: khung được ghim full màn hình (nội dung header ẩn), cuộn
 * dọc đẩy dải chữ trượt ngang. Logo con dê thu nhỏ lại rồi nhảy từng nhịp qua câu
 * chào đang trôi phía sau (mix-blend-difference => đè lên chữ trắng thì hóa đen),
 * nhịp cuối đáp lên chữ GOAT RISE đúng lúc dải dừng (GOAT RISE đứng yên giữa màn
 * hình). Cuộn tiếp thì dê bay vọt ra khỏi màn hình, rồi GOAT RISE thu nhỏ bay lên
 * đúng chỗ logo header trong lúc màn đen mờ dần để lộ `children` (hero) nằm
 * sẵn bên dưới; khung nhả ra thì logo header hiện đúng chỗ đó, trao tay liền mạch.
 */
export function IntroLeap({ children }: { children: ReactNode }) {
  const ref = useIntroScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-header-hide
      className="intro-section relative -mt-12 bg-black text-white md:-mt-14"
    >
      <div
        data-intro-stage
        className="intro-stage sticky top-0 h-[100svh] overflow-hidden"
      >
        {/* Màn đen che hero; pha cuối mờ dần để lộ hero */}
        <div
          aria-hidden
          className="intro-curtain pointer-events-none absolute inset-0 bg-black"
        />

        {/* intro không có gì để bấm: bỏ bắt chuột để hero bên dưới bấm được */}
        <section
          aria-label="Giới thiệu GOAT RISE"
          className="intro-scene pointer-events-none relative size-full"
        >
          <div data-intro-track className="intro-track flex h-full w-max">
            {/* màn đầu chỉ có logo (lớp dê phía trên): tấm trống một màn hình
                để câu chào bắt đầu trôi vào từ mép phải */}
            <div aria-hidden className="w-screen shrink-0" />
            <Greeting />
            <Wordmark />
          </div>

          {/* Dê nằm ngoài dải: đứng gần yên một chỗ, thế giới trôi bên dưới */}
          <img
            src="/goatrise-bg-logo.png"
            alt=""
            aria-hidden
            className="intro-goat pointer-events-none absolute top-1/2 left-1/2 size-(--goat) max-w-none mix-blend-difference invert"
          />
        </section>

        {/* Hero nằm sẵn dưới màn đen (z-index âm trong khung dính) */}
        <div className="intro-hero absolute inset-0 overflow-hidden">
          <div className="intro-hero-inner size-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Greeting() {
  return (
    <p
      aria-label="Hey Goat, ready to rise?"
      className="flex shrink-0 items-center gap-[0.3em] px-[8vw] font-logo text-[min(15vw,30svh)] leading-none font-extrabold tracking-[-0.04em] uppercase"
    >
      {GREETING.map((word) => (
        <Letters key={word} word={word} />
      ))}
    </p>
  );
}

/** Tấm cuối dải: dải dừng lại khi tấm này vừa khít màn hình => GOAT RISE đứng yên giữa màn */
function Wordmark() {
  return (
    <div className="flex h-full w-screen shrink-0 items-center justify-center">
      {/* khoảng cách chữ / giữa hai từ nằm trong .intro-wordmark vì chúng đổi
          dần cho khớp logo header lúc bay lên */}
      <h2
        data-intro-wordmark
        aria-label="GOAT RISE"
        className="intro-wordmark flex items-center font-logo text-(length:--word) leading-none font-extrabold uppercase"
      >
        <Letters word="Goat" />
        <Letters word="Rise" />
      </h2>
    </div>
  );
}

/** Mỗi chữ cái một mặt nạ, trồi lên khi trôi vào màn hình (.intro-letter theo --d) */
function Letters({ word }: { word: string }) {
  return (
    <span aria-hidden className="flex">
      {/* chỉ cắt trục dọc để tracking âm không xén mép chữ */}
      {[...word].map((letter, index) => (
        <span
          key={index}
          data-intro-letter
          className="block overflow-y-clip py-[0.04em]"
        >
          <span className="intro-letter block">{letter}</span>
        </span>
      ))}
    </span>
  );
}
