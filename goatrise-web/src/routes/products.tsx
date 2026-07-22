import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products")({ component: ProductsPage });

function ProductsPage() {
  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight uppercase">Sản phẩm</h1>
    </div>
  );
}
