import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/shared/policy-page";
import { getMessages, useLocale } from "@/i18n";
import { getPolicyContent } from "@/i18n/content/policies";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/policies")({
  head: ({ match }) => {
    const { locale } = match.context;
    const t = getMessages(locale);
    return seo({
      locale,
      title: t.seo.policies.title,
      description: t.seo.policies.description,
      path: "/policies",
    });
  },
  component: PoliciesPage,
});

function PoliciesPage() {
  // nội dung chính sách viết riêng theo từng ngôn ngữ (src/i18n/content/policies)
  const content = getPolicyContent(useLocale());

  return (
    <PolicyPage
      title={content.title}
      updatedAt={content.updatedAt}
      intro={content.intro}
      sections={content.sections}
    />
  );
}
