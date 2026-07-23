export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Goatrise</span>
        {/* TODO: add footer links */}
      </div>
    </footer>
  )
}
