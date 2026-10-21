import { createFileRoute } from "@tanstack/react-router";

import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      title: "Về chúng tôi",
      description:
        "Câu chuyện của GOAT RISE - thương hiệu hoạt phục và thời trang cổ điển Việt Nam, làm quần áo cho nhịp sống bền bỉ mỗi ngày.",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight uppercase">
        Về chúng tôi
      </h1>
    </div>
  );
}
