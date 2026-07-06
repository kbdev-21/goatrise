import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export default function OrdersPage() {
  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      {/* ----- header ----- */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">Orders</h1>
        <Button disabled>
          <Plus className="size-4" />
          New Order
        </Button>
      </div>

      {/* ----- placeholder ----- */}
      <div className="bg-card text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 rounded-md border p-12">
        <ShoppingCart className="size-8" />
        <p className="text-sm">Orders management is coming soon.</p>
      </div>
    </div>
  );
}
