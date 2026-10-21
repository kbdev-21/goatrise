import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { FaInstagram } from "react-icons/fa6";

import { INSTAGRAM_URL } from "@/constant/social";
import { Reveal } from "@/components/shared/reveal";
import { RollText } from "@/components/shared/roll-text";
import { getLenis } from "@/hooks/use-smooth-scroll";

// header cao 4rem + chừa thêm 2rem để tiêu đề mục không dính sát header
// (khớp scroll-mt-24 dùng cho lúc nhảy anchor native, khi Lenis tắt)
const SECTION_SCROLL_OFFSET = 96;

export type PolicySection = {
  // dùng làm anchor (#id) cho mục lục
  id: string;
  title: string;
  content: ReactNode;
};

/**
 * Khung chung cho các trang chính sách (đổi trả, vận chuyển, bảo mật...):
 * tiêu đề lớn + ngày cập nhật, mục lục ghim bên trái (desktop), các mục đánh số
 * bên phải, cuối trang là khối liên hệ. Nội dung mục viết bằng JSX thường
 * (p / ul / ol / strong), style chung đặt ở đây.
 */
export function PolicyPage({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro?: ReactNode;
  sections: PolicySection[];
}) {
  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-10 pb-20 lg:px-10 lg:pt-16 lg:pb-28">
      {/* nằm ngay màn đầu nên chạy bằng CSS animation lúc tải trang, không chờ JS */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            className="rise-fade text-[11px] font-bold tracking-[0.18em] uppercase opacity-55"
            style={{ "--rise-delay": "100ms" } as CSSProperties}
          >
            GOAT RISE
          </p>
          <h1
            className="rise-fade mt-3 font-logo text-[clamp(2rem,5vw,3.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase"
            style={{ "--rise-delay": "200ms" } as CSSProperties}
          >
            {title}
          </h1>
        </div>
        <p
          className="rise-fade shrink-0 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase tabular-nums opacity-55"
          style={{ "--rise-delay": "300ms" } as CSSProperties}
        >
          Cập nhật {updatedAt}
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-10 border-t border-border pt-10 lg:grid-cols-12 lg:pt-16">
        {/* Mục lục: chỉ desktop, ghim theo khi cuộn */}
        <nav
          aria-label="Mục lục"
          className="hidden lg:sticky lg:top-24 lg:col-span-3 lg:block lg:self-start"
        >
          <ol className="flex flex-col">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={(event) => scrollToSection(event, section.id)}
                  className="group flex items-baseline gap-3 py-1.5 text-[11px] font-bold tracking-[0.08em] uppercase opacity-60 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
                >
                  <span className="tabular-nums opacity-55">
                    {formatIndex(index)}
                  </span>
                  <RollText label={section.title} />
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="lg:col-span-7 lg:col-start-5">
          {intro ? (
            <Reveal>
              <div className="max-w-2xl pb-10 text-base leading-relaxed">
                {intro}
              </div>
            </Reveal>
          ) : null}

          {sections.map((section, index) => (
            <Reveal
              key={section.id}
              className="border-t border-border py-10 first:border-t-0 first:pt-0"
            >
              <section
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="grid scroll-mt-24 grid-cols-1 gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)]"
              >
                <p className="text-[11px] font-bold tracking-[0.14em] tabular-nums opacity-55 sm:pt-0.5">
                  {formatIndex(index)}
                </p>
                <div>
                  <h2
                    id={`${section.id}-title`}
                    className="text-sm font-bold tracking-[0.08em] uppercase"
                  >
                    {section.title}
                  </h2>
                  <div className="mt-5 flex max-w-2xl flex-col gap-4 text-sm leading-relaxed font-light [&_li]:pl-1 [&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
                    {section.content}
                  </div>
                </div>
              </section>
            </Reveal>
          ))}

          {/* Liên hệ: chung cho mọi trang chính sách */}
          <Reveal className="border-t border-border pt-10">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[3.5rem_minmax(0,1fr)]">
              <span aria-hidden />
              <div>
                <h2 className="text-sm font-bold tracking-[0.08em] uppercase">
                  Cần hỗ trợ thêm?
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-relaxed font-light">
                  Nhắn cho GOAT RISE qua Instagram, chúng tôi sẽ phản hồi trong
                  giờ làm việc.
                </p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-6 inline-flex h-11 items-center gap-3 border border-border px-7 text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-300 hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  <FaInstagram aria-hidden className="size-4" />
                  <RollText label="Liên hệ chúng tôi" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

// Lenis đang chạy thì để nó cuộn mượt (nhảy anchor native sẽ giật rồi bị Lenis kéo lại);
// tắt hiệu ứng (reduced motion) thì để trình duyệt tự nhảy theo href + scroll-mt
function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const lenis = getLenis();
  const target = document.getElementById(id);
  if (!lenis || !target) {
    return;
  }
  event.preventDefault();
  lenis.scrollTo(target, { offset: -SECTION_SCROLL_OFFSET });
}

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}
