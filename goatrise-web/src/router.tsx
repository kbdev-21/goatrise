import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { QueryClient } from "@tanstack/react-query"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { routeTree } from "./routeTree.gen"
import {
  getLocaleFromPath,
  localizePath,
  stripLocalePrefix,
} from "@/i18n/locale-path"

export function getRouter() {
  const queryClient = new QueryClient()

  // output rewrite cần biết trang hiện tại đang ở ngôn ngữ nào => đọc từ chính router này
  // (server tạo router mới cho mỗi request nên không lẫn ngôn ngữ giữa các request)
  const holder: { router?: { latestLocation?: { publicHref: string } } } = {}

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },

    // Ngôn ngữ nằm trên URL (/en/...) nhưng route không biết tới tiền tố này:
    // input bỏ tiền tố trước khi khớp route, output gắn lại vào mọi link / navigate.
    // Đổi ngôn ngữ là tải lại trang (LocaleSwitcher) nên trong một lần tải locale không đổi
    rewrite: {
      input: ({ url }) => {
        url.pathname = stripLocalePrefix(url.pathname)
        return url
      },
      output: ({ url }) => {
        const currentHref =
          holder.router?.latestLocation?.publicHref ??
          (typeof window === "undefined" ? "/" : window.location.pathname)
        url.pathname = localizePath(url.pathname, getLocaleFromPath(currentHref))
        return url
      },
    },

    // không khôi phục vị trí cuộn (kể cả F5 / back): mọi trang luôn mở ở đầu trang
    scrollRestoration: false,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })
  holder.router = router

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
