import { DEFAULT_LOCALE } from "./config";
import type { Locale } from "./config";

// chỉ ngôn ngữ khác mặc định mới có tiền tố trên URL; tiếng Việt giữ nguyên URL cũ
const PREFIXES: Partial<Record<Locale, string>> = {
  en: "/en",
};

// "/en", "/en/products", "/en?x", "/en#y" => en; còn lại => mặc định
export function getLocaleFromPath(pathOrHref: string): Locale {
  for (const [locale, prefix] of Object.entries(PREFIXES)) {
    if (hasPrefix(pathOrHref, prefix)) {
      return locale as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

// "/en/products?x" => "/products?x"; "/en" => "/"
export function stripLocalePrefix(pathOrHref: string): string {
  for (const prefix of Object.values(PREFIXES)) {
    if (hasPrefix(pathOrHref, prefix)) {
      const rest = pathOrHref.slice(prefix.length);
      return rest.startsWith("/") ? rest : `/${rest}`;
    }
  }
  return pathOrHref;
}

// đường dẫn nội bộ (không tiền tố) -> đường dẫn công khai của ngôn ngữ đó.
// "/" + en => "/en" (không có "/" cuối) để khớp đúng URL mà stripLocalePrefix nhận vào
export function localizePath(path: string, locale: Locale): string {
  const prefix = PREFIXES[locale];
  if (!prefix) {
    return path;
  }
  return path === "/" || /^\/[?#]/.test(path)
    ? `${prefix}${path.slice(1)}`
    : `${prefix}${path}`;
}

function hasPrefix(pathOrHref: string, prefix: string): boolean {
  if (!pathOrHref.startsWith(prefix)) {
    return false;
  }
  const next = pathOrHref.charAt(prefix.length);
  return next === "" || next === "/" || next === "?" || next === "#";
}
