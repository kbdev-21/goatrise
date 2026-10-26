import { localizePath, stripLocalePrefix, useLocale, useT } from "@/i18n";
import type { Locale } from "@/i18n";
import { cn } from "@/lib/utils";

// mỗi lựa chọn gồm cả ngôn ngữ lẫn tiền tệ (vi => VND, en => USD, xem i18n/currency)
const OPTIONS: { locale: Locale; short: string; symbol: string }[] = [
  { locale: "vi", short: "VI", symbol: "₫" },
  { locale: "en", short: "EN", symbol: "$" },
];

/**
 * Nút nổi góc dưới phải: chuyển giữa Tiếng Việt + VND và English + USD.
 * Giữ nguyên trang đang xem, chỉ đổi tiền tố /en trên URL. Tải lại cả trang
 * (không navigate trong SPA) để server render đúng ngôn ngữ từ đầu và mọi link
 * được router gắn lại tiền tố mới.
 */
export function LocaleSwitcher() {
  const t = useT();
  const locale = useLocale();

  function switchTo(next: Locale) {
    if (next === locale) {
      return;
    }
    const { pathname, search, hash } = window.location;
    window.location.assign(
      localizePath(`${stripLocalePrefix(pathname)}${search}${hash}`, next)
    );
  }

  return (
    <div
      role="group"
      aria-label={t.localeSwitcher.label}
      // right-4: chừa dải thanh cuộn tự vẽ (w-3) sát mép phải; z-40 ngang header, drawer / dialog (z-50) đè lên.
      // locale-switcher: ẩn khi đang ở intro trang chủ (styles.css)
      className="locale-switcher fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex border border-foreground bg-background text-foreground shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]"
    >
      {OPTIONS.map((option) => {
        const isActive = option.locale === locale;
        return (
          <button
            key={option.locale}
            type="button"
            lang={option.locale}
            aria-pressed={isActive}
            aria-label={t.localeSwitcher[option.locale]}
            onClick={() => switchTo(option.locale)}
            className={cn(
              "flex h-9 cursor-pointer items-center gap-1.5 px-3 text-[11px] font-bold tracking-[0.08em] uppercase transition-colors duration-300",
              isActive
                ? "cursor-default bg-foreground text-background"
                : "opacity-60 hover:opacity-100 focus-visible:opacity-100"
            )}
          >
            <span>{option.short}</span>
            <span aria-hidden className="tabular-nums opacity-60">
              {option.symbol}
            </span>
          </button>
        );
      })}
    </div>
  );
}
