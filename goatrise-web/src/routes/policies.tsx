import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/policies")({
  beforeLoad: () => {
    throw redirect({ to: "/policies/returns", statusCode: 301 });
  },
});
