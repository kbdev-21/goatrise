import { Link } from "@tanstack/react-router"

import { useT } from "@/i18n"

export function Footer() {
  const t = useT()

  return (
    <footer className="mt-auto w-full border-t border-border bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Goatrise</span>
        {/* TODO: add footer links */}
        <nav aria-label={t.footer.policies}>
          <Link
            to="/policies"
            className="transition-colors hover:text-foreground"
          >
            {t.footer.policies}
          </Link>
        </nav>
      </div>
    </footer>
  )
}
