import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import { DEFAULT_LOCALE, INTL_LOCALE } from "./config";
import type { Locale } from "./config";
import { formatPrice } from "./currency";
import { en } from "./messages/en";
import { vi } from "./messages/vi";
import type { Messages } from "./messages/vi";

export type { Messages };
export * from "./config";
export * from "./currency";
export * from "./locale-path";

const MESSAGES: Record<Locale, Messages> = { vi, en };

// Dùng ở nơi không gọi được hook: head() của route (locale lấy từ match.context.locale), hàm thuần...
export function getMessages(locale: Locale = DEFAULT_LOCALE): Messages {
  return MESSAGES[locale];
}

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

// __root đặt locale theo URL (/en/... => en)
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

// const t = useT(); rồi dùng t.checkout.title, t.cart.lowStock(3)...
export function useT(): Messages {
  return MESSAGES[useLocale()];
}

// const formatPrice = useFormatPrice(); formatPrice(199000) => "199.000 đ" hoặc "$7.65"
export function useFormatPrice(): (valueVnd: number) => string {
  const locale = useLocale();
  return (valueVnd) => formatPrice(valueVnd, locale);
}

// Nội dung song ngữ từ backend (title, shortDescription...): bản ngôn ngữ đang chọn, trống thì lùi về tiếng Việt.
// Nhận cả chuỗi thường: giỏ hàng lưu trong localStorage trước khi có đa ngôn ngữ chỉ giữ chuỗi tiếng Việt
export type LocalizedText = { vi: string; en: string };

export function localized(
  text: LocalizedText | string | null | undefined,
  locale: Locale
): string {
  if (!text) {
    return "";
  }
  if (typeof text === "string") {
    return text;
  }
  // dữ liệu cũ có thể thiếu hẳn key en => không tin hoàn toàn vào kiểu
  const value = text[locale] as string | undefined;
  return value?.trim() ? value : text.vi;
}

// const l = useLocalized(); l(product.title)
export function useLocalized(): (
  text: LocalizedText | string | null | undefined
) => string {
  const locale = useLocale();
  return (text) => localized(text, locale);
}

// tên quốc gia trong constant/countries theo ngôn ngữ
export function countryName(
  country: { viName: string; enName: string },
  locale: Locale
): string {
  return locale === "vi" ? country.viName : country.enName;
}

// tạo sẵn một formatter mỗi ngôn ngữ (dd/mm/yyyy với vi, mm/dd/yyyy với en)
const DATE_FORMATS: Record<Locale, Intl.DateTimeFormat> = {
  vi: createDateFormat("vi"),
  en: createDateFormat("en"),
};

function createDateFormat(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDate(value: string | Date, locale: Locale): string {
  return DATE_FORMATS[locale].format(new Date(value));
}
