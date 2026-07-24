import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/coming-soon")({ component: ComingSoonPage });

function ComingSoonPage() {
  return (
    <section className="flex min-h-svh w-full items-center justify-center px-6">
      <h1 className="text-sm font-semibold tracking-[0.25em] text-foreground uppercase">
        Coming soon
      </h1>
    </section>
  );
}
