import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Về chúng tôi
      </h1>
    </div>
  );
}
