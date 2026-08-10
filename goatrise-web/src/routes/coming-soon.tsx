import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

const PREVIEW_CODE = "goatrisepreview";

export const Route = createFileRoute("/coming-soon")({
  validateSearch: (search: Record<string, unknown>) => ({
    previewCode: typeof search.previewCode === "string" ? search.previewCode : undefined,
  }),
  component: ComingSoonPage,
});

function ComingSoonPage() {
  const { previewCode } = Route.useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    // chỉ chạy client-side; mở khóa preview cho máy này rồi về trang chủ
    if (previewCode === PREVIEW_CODE) {
      localStorage.setItem("isPublic", "true");
      navigate({ to: "/" });
    }
  }, [previewCode, navigate]);

  return (
    <section className="flex min-h-svh w-full items-center justify-center px-6">
      <h1 className="text-sm font-semibold tracking-[0.25em] text-foreground uppercase">
        Coming soon
      </h1>
    </section>
  );
}
