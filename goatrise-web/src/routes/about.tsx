import { createFileRoute } from "@tanstack/react-router";

import { getMessages, useT } from "@/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: ({ match }) => {
    const { locale } = match.context;
    const t = getMessages(locale);
    return seo({
      locale,
      title: t.seo.about.title,
      description: t.seo.about.description,
      path: "/about",
    });
  },
  component: AboutPage,
});

function AboutPage() {
  const t = useT();

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        {t.about.title}
      </h1>
    </div>
  );
}
