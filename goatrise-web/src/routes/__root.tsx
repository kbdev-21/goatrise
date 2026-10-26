import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import "@/core/auth";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageScrollbar } from "@/components/layout/page-scrollbar";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import {
  DEFAULT_IMAGE,
  SITE_NAME,
  toAbsoluteUrl,
} from "@/lib/seo";
import {
  I18nProvider,
  OG_LOCALE,
  getLocaleFromPath,
  getMessages,
  useT,
} from "@/i18n";

import appCss from "../styles.css?url"

const defaultImageUrl = toAbsoluteUrl(DEFAULT_IMAGE)

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // ngôn ngữ đọc từ URL công khai (/en/...); route con lấy qua match.context.locale trong head()
  beforeLoad: ({ location }) => ({
    locale: getLocaleFromPath(location.publicHref),
  }),
  head: ({ match }) => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      // mặc định cho mọi trang; route con ghi đè theo name / property (xem lib/seo.ts)
      {
        title: getMessages(match.context.locale).seo.defaultTitle,
      },
      {
        name: "description",
        content: getMessages(match.context.locale).seo.defaultDescription,
      },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: OG_LOCALE[match.context.locale] },
      { property: "og:type", content: "website" },
      ...(defaultImageUrl
        ? [
            { property: "og:image", content: defaultImageUrl },
            { name: "twitter:image", content: defaultImageUrl },
          ]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.json" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/goatrise-bg-logo.png",
        type: "image/png",
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  const t = useT();

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>{t.notFound.message}</p>
    </main>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  // trang tài khoản tự lo header riêng (đăng nhập: không header; đã đăng nhập: header tài khoản)
  const hideSiteHeader = useRouterState({
    select: (s) => s.location.pathname === "/account",
  });

  useSmoothScroll();

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  // F5 luôn về đầu trang: không cho trình duyệt tự khôi phục vị trí cuộn cũ
  // (giá trị này lưu theo mục lịch sử nên lần tải lại sau đã có hiệu lực)
  useEffect(() => {
    history.scrollRestoration = "manual";
  }, []);

  // rehydrate giỏ hàng sau khi mount để tránh lệch SSR (localStorage chỉ có ở client)
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  // /en/... => en, còn lại => vi (location.pathname đã bỏ tiền tố, publicHref thì còn)
  const locale = useRouterState({
    select: (s) => getLocaleFromPath(s.location.publicHref),
  });

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
        {/* Không có JS thì bỏ qua hiệu ứng hiện dần, nội dung vẫn đọc được */}
        <noscript>
          <style>{`[data-reveal]{opacity:1;transform:none}`}</style>
        </noscript>
      </head>
      <body>
        <I18nProvider locale={locale}>
          <div className="flex min-h-svh flex-col">
            {hideSiteHeader ? null : <Header />}
            {/* header fixed nên main phải tự chừa đúng chiều cao của nó */}
            <main className={hideSiteHeader ? "flex-1" : "flex-1 pt-12 md:pt-14"}>
              {children}
            </main>
            <Footer />
          </div>
          <LocaleSwitcher />
        </I18nProvider>
        <PageScrollbar />
        <TanStackDevtools
          config={{
            // góc dưới phải dành cho nút chuyển ngôn ngữ / tiền tệ
            position: "bottom-left",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
