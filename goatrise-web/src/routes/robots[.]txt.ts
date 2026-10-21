import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/lib/seo";

// sinh động (thay cho public/robots.txt) vì dòng Sitemap bắt buộc là URL tuyệt đối
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = SITE_URL || new URL(request.url).origin;

        const body = `User-agent: *
Disallow: /checkout
Disallow: /account

Sitemap: ${origin}/sitemap.xml
`;

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
