import { cn } from "@/lib/utils";

// badge label + màu dùng chung cho các bảng (status, payment, channel, source...)
export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
