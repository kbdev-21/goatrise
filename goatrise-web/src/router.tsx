import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { QueryClient } from "@tanstack/react-query"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient()

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },

    // không khôi phục vị trí cuộn (kể cả F5 / back): mọi trang luôn mở ở đầu trang
    scrollRestoration: false,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
