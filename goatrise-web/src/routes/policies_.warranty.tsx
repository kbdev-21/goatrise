import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/shared/policy-page";
import { useLocale } from "@/i18n";
import { getPolicyContent } from "@/i18n/content/policies";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/policies_/warranty")({
  head: ({ match }) => {
    const { locale } = match.context;
    const content = getPolicyContent(locale, "warranty");
    return seo({
      locale,
      title: content.title,
      description: content.description,
      path: "/policies/warranty",
    });
  },
  component: PolicyRoute,
});

function PolicyRoute() {
  const content = getPolicyContent(useLocale(), "warranty");
  return <PolicyPage {...content} />;
}
