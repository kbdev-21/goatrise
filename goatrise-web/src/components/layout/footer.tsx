import { Link } from "@tanstack/react-router";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";

import { navItems } from "@/components/layout/nav-config";
import { BrandWordmark } from "@/components/shared/brand-wordmark";
import { PolicyLinks } from "@/components/shared/policy-links";
import { FACEBOOK_URL, INSTAGRAM_URL, TIKTOK_URL } from "@/constant/social";
import { useT } from "@/i18n";

const LINK_CLASS =
  "inline-flex min-h-11 items-center text-sm transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground";
const LABEL_CLASS =
  "mb-4 text-[11px] font-bold tracking-[0.16em] text-foreground uppercase";

export function Footer() {
  const t = useT();

  return (
    <footer className="mt-auto w-full border-t border-border bg-background text-foreground">
      <div className="mx-auto max-w-[1500px] px-5 lg:px-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-[2fr_1fr_1fr] md:gap-10 md:py-16">
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              aria-label={t.common.homeAriaLabel}
              className="inline-flex min-h-11 max-w-full items-center py-2 text-[clamp(1.5rem,2.5vw,2rem)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              <BrandWordmark />
            </Link>
            <p className="mt-5 max-w-64 text-sm leading-relaxed text-muted-foreground">
              {t.footer.description}
            </p>
            <nav
              aria-label={t.footer.connect}
              className="mt-4 -ml-3 text-muted-foreground"
            >
              <ul className="flex items-center gap-2">
                {[
                  {
                    href: INSTAGRAM_URL,
                    label: t.footer.instagramAriaLabel,
                    Icon: FaInstagram,
                    iconClassName: "size-[18px]",
                  },
                  {
                    href: FACEBOOK_URL,
                    label: t.footer.facebookAriaLabel,
                    Icon: FaFacebookF,
                    iconClassName: "size-4",
                  },
                  {
                    href: TIKTOK_URL,
                    label: t.footer.tiktokAriaLabel,
                    Icon: FaTiktok,
                    iconClassName: "size-4",
                  },
                ].map(({ href, label, Icon, iconClassName }) => (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className="inline-flex size-11 items-center justify-center transition-colors duration-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
                      >
                        <Icon aria-hidden className={iconClassName} />
                      </a>
                    ) : (
                      <span
                        role="img"
                        aria-label={label}
                        className="inline-flex size-11 items-center justify-center"
                      >
                        <Icon aria-hidden className={iconClassName} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <nav aria-label={t.footer.explore}>
            <h2 className={LABEL_CLASS}>{t.footer.explore}</h2>
            <ul className="text-muted-foreground">
              {navItems.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={LINK_CLASS}
                    activeProps={{
                      "aria-current": "page",
                    }}
                  >
                    {t.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={LABEL_CLASS}>{t.footer.policies}</h2>
            <PolicyLinks
              highlightActive={false}
              className="text-muted-foreground [&_ul]:flex-col [&_ul]:gap-0"
            />
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-border pt-6 pb-20 text-center text-sm text-muted-foreground md:pb-16">
          <span className="text-sm">
            © {new Date().getFullYear()} GOAT RISE · MADE IN SAIGON, VIETNAM
          </span>
        </div>
      </div>
    </footer>
  );
}
