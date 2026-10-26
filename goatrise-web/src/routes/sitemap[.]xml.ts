import { createFileRoute } from "@tanstack/react-router";

import { findAllCollections } from "@/api/collection/api";
import { findAllProducts } from "@/api/product/api";
import { DEFAULT_LOCALE, LOCALES, localizePath } from "@/i18n";
import { SITE_URL } from "@/lib/seo";

type SitemapEntry = {
  // đường dẫn nội bộ, chưa có tiền tố ngôn ngữ
  path: string;
  // ISO date (yyyy-mm-dd); bỏ trống với trang tĩnh
  lastmod?: string;
};

// trang tĩnh được index (checkout / account cố ý không có: đã noindex + chặn ở robots.txt)
const STATIC_PATHS = ["/", "/products", "/collections", "/about", "/policies"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // chưa cấu hình VITE_SITE_URL thì lấy theo domain đang được truy cập
        const origin = SITE_URL || new URL(request.url).origin;

        const [products, collections] = await Promise.all([
          findAllProducts(),
          findAllCollections(),
        ]);

        const entries: SitemapEntry[] = [
          ...STATIC_PATHS.map((path) => ({ path })),
          ...products
            .filter((product) => product.isActive)
            .map((product) => ({
              path: `/products/${product.slug}`,
              lastmod: toDate(product.updatedAt),
            })),
          // bộ sưu tập có trang riêng; danh mục là trang /products đã lọc sẵn
          ...collections
            .filter((collection) => collection.isActive)
            .flatMap((collection) => {
              if (collection.type === "COLLECTION") {
                return [
                  {
                    path: `/collections/${collection.id}`,
                    lastmod: toDate(collection.updatedAt),
                  },
                ];
              }
              if (collection.type === "CATEGORY") {
                return [
                  {
                    path: `/products?category=${encodeURIComponent(collection.slug)}`,
                    lastmod: toDate(collection.updatedAt),
                  },
                ];
              }
              return [];
            }),
        ];

        // mỗi trang một <url> cho từng ngôn ngữ, kèm xhtml:link trỏ tới đủ các bản (hreflang)
        const urls = entries
          .flatMap(({ path, lastmod }) => {
            const alternates = [
              ...LOCALES.map((locale) => ({
                hreflang: locale,
                href: `${origin}${localizePath(path, locale)}`,
              })),
              {
                hreflang: "x-default",
                href: `${origin}${localizePath(path, DEFAULT_LOCALE)}`,
              },
            ]
              .map(
                ({ hreflang, href }) =>
                  `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}"/>`
              )
              .join("");

            return LOCALES.map(
              (locale) =>
                `  <url><loc>${escapeXml(`${origin}${localizePath(path, locale)}`)}</loc>${
                  lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
                }${alternates}</url>`
            );
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

function toDate(isoString: string): string {
  return isoString.slice(0, 10);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
