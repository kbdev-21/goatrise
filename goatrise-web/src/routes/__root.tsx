import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
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
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "GOAT RISE - Vietnam, Activewear & Classic For Life",
      },
    ],
    links: [
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
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);

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

  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* Không có JS thì bỏ qua hiệu ứng hiện dần, nội dung vẫn đọc được */}
        <noscript>
          <style>{`[data-reveal]{opacity:1;transform:none}`}</style>
        </noscript>
      </head>
      <body>
        <div className="flex min-h-svh flex-col">
          <Header />
          {/* header fixed nên main phải tự chừa đúng chiều cao của nó */}
          <main className="flex-1 pt-12 md:pt-14">{children}</main>
          <Footer />
        </div>
        <PageScrollbar />
        <TanStackDevtools
          config={{
            position: "bottom-right",
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
