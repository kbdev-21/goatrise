import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import "@/core/auth";
import { useAuthStore } from "@/stores/auth.store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

import appCss from "../styles.css?url"

const COMING_SOON_PATH = "/coming-soon";
// chỉ đóng site khi biến được set rõ ràng là "false"
const isPublic = import.meta.env.VITE_IS_PUBLIC !== "false";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: ({ location }) => {
    if (isPublic || location.pathname === COMING_SOON_PATH) {
      return;
    }

    throw redirect({ to: COMING_SOON_PATH });
  },
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
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
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
  const isComingSoon = useRouterState({
    select: (s) => s.location.pathname === COMING_SOON_PATH,
  });

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="flex min-h-svh flex-col">
          {isComingSoon ? null : <Header />}
          <main className="flex-1">{children}</main>
          {isComingSoon ? null : <Footer />}
        </div>
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
