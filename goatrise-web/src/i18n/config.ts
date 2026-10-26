export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];

// ngôn ngữ mặc định: URL không có tiền tố (/products); ngôn ngữ khác có tiền tố (/en/products)
export const DEFAULT_LOCALE: Locale = "vi";

// mã cho Intl (định dạng ngày / số)
export const INTL_LOCALE: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-US",
};

// giá trị cho thẻ og:locale
export const OG_LOCALE: Record<Locale, string> = {
  vi: "vi_VN",
  en: "en_US",
};
