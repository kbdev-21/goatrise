import { Link } from "@tanstack/react-router";

import { useLocale, useT } from "@/i18n";
import { getPolicyContent, POLICY_LINKS } from "@/i18n/content/policies";

export function PolicyLinks({
  className,
  highlightActive = true,
}: {
  className?: string;
  highlightActive?: boolean;
}) {
  const locale = useLocale();
  const t = useT();

  return (
    <nav aria-label={t.footer.policies} className={className}>
      <ul className="flex flex-wrap gap-x-6 gap-y-1">
        {POLICY_LINKS.map(({ id, to }) => (
          <li key={id}>
            <Link
              to={to}
              className="inline-flex min-h-11 items-center text-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              activeProps={{
                "aria-current": "page",
                className: highlightActive ? "font-semibold text-foreground" : "",
              }}
            >
              {getPolicyContent(locale, id).title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
