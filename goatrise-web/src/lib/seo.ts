import { DEFAULT_LOCALE, LOCALES, getMessages, localizePath } from "@/i18n";
import type { Locale } from "@/i18n";

export const SITE_NAME = "GOAT RISE";
// title / description mặc định nằm trong messages (seo.defaultTitle, seo.defaultDescription)
// logo vuông trong /public: ảnh chia sẻ mặc định khi trang không có ảnh riêng
export const DEFAULT_IMAGE = "/goatrise-bg-logo.png";

// domain thật của site (vd https://goatrise.vn), không có dấu / cuối.
// canonical / og:url / og:image bắt buộc phải là URL tuyệt đối => chưa cấu hình thì bỏ các thẻ đó
export const SITE_URL = String(import.meta.env.VITE_SITE_URL ?? "").replace(
  /\/+$/,
  ""
);

const DESCRIPTION_MAX_LENGTH = 160;

type MetaTag = React.JSX.IntrinsicElements["meta"];
type LinkTag = React.JSX.IntrinsicElements["link"];

export type SeoOptions = {
  // ngôn ngữ của trang (match.context.locale): chọn chữ mặc định + gắn tiền tố /en vào URL
  locale: Locale;
  // bỏ trống => title mặc định của site (trang chủ)
  title?: string;
  description?: string | null;
  // pathname nội bộ, KHÔNG có tiền tố ngôn ngữ (+ search nếu là trang riêng, vd danh mục),
  // dùng cho canonical / og:url / hreflang
  path: string;
  // URL tuyệt đối hoặc đường dẫn trong /public
  image?: string | null;
  type?: "website" | "product" | "article";
  // trang không nên lên kết quả tìm kiếm (giỏ hàng, tài khoản, thanh toán...)
  noindex?: boolean;
  // thẻ meta bổ sung riêng từng trang (vd giá sản phẩm, JSON-LD)
  extraMeta?: MetaTag[];
};

/**
 * Dựng meta + link cho head() của từng route. Root đã có các giá trị mặc định
 * (site_name, locale, description...); HeadContent gộp meta theo name/property
 * và route sâu nhất thắng, nên ở đây chỉ cần trả phần riêng của trang.
 * Link KHÔNG được gộp (cộng dồn qua mọi route) => canonical chỉ đặt ở route lá.
 */
export function seo({
  locale,
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  extraMeta = [],
}: SeoOptions): { meta: MetaTag[]; links: LinkTag[] } {
  const t = getMessages(locale);
  const fullTitle = title ? `${title} - ${SITE_NAME}` : t.seo.defaultTitle;
  const desc = toMetaDescription(description) ?? t.seo.defaultDescription;
  const url = toAbsoluteUrl(localizePath(path, locale));
  const imageUrl = toAbsoluteUrl(image ?? DEFAULT_IMAGE);

  const meta: MetaTag[] = [
    { title: fullTitle },
    { name: "description", content: desc },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: desc },
    { property: "og:type", content: type },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: desc },
  ];

  if (url) {
    meta.push({ property: "og:url", content: url });
  }
  if (imageUrl) {
    meta.push(
      { property: "og:image", content: imageUrl },
      { name: "twitter:image", content: imageUrl }
    );
  }
  if (noindex) {
    meta.push({ name: "robots", content: "noindex, nofollow" });
  }

  return {
    meta: [...meta, ...extraMeta],
    // trang noindex thì canonical / hreflang không có ý nghĩa
    links: url && !noindex ? [{ rel: "canonical", href: url }, ...alternateLinks(path)] : [],
  };
}

// hreflang: báo cho Google các bản ngôn ngữ của cùng một trang; x-default = bản tiếng Việt
function alternateLinks(path: string): LinkTag[] {
  const links: LinkTag[] = [];
  for (const locale of LOCALES) {
    const href = toAbsoluteUrl(localizePath(path, locale));
    if (href) {
      links.push({ rel: "alternate", hrefLang: locale, href });
    }
  }
  const defaultHref = toAbsoluteUrl(localizePath(path, DEFAULT_LOCALE));
  if (defaultHref) {
    links.push({ rel: "alternate", hrefLang: "x-default", href: defaultHref });
  }
  return links;
}

// HeadContent render { "script:ld+json": data } thành <script type="application/ld+json">,
// nhưng type meta của React không khai báo key này => ép kiểu tại một chỗ duy nhất
export function jsonLd(data: Record<string, unknown>): MetaTag {
  return { "script:ld+json": data } as unknown as MetaTag;
}

// URL tuyệt đối: giữ nguyên nếu đã có http(s), không thì ghép với SITE_URL (null nếu chưa cấu hình)
export function toAbsoluteUrl(pathOrUrl: string): string | null {
  if (/^https?:\/\//.test(pathOrUrl)) {
    return pathOrUrl;
  }
  if (!SITE_URL) {
    return null;
  }
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

// gộp khoảng trắng + cắt ở ranh giới từ cho vừa độ dài Google hiển thị
function toMetaDescription(text: string | null | undefined): string | null {
  const clean = text?.replace(/\s+/g, " ").trim();
  if (!clean) {
    return null;
  }
  if (clean.length <= DESCRIPTION_MAX_LENGTH) {
    return clean;
  }
  const cut = clean.slice(0, DESCRIPTION_MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}
