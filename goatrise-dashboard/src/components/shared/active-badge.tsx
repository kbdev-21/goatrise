import { Badge } from "@/components/shared/badge.tsx";

// badge Active/Inactive dùng chung cho collections, products, items
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge label="Active" className="bg-green-100 text-green-700" />
  ) : (
    <Badge label="Inactive" className="bg-muted text-muted-foreground" />
  );
}
