import { cn } from "@/lib/utils";
import type { UserRole } from "@/api/user/api.ts";

// chuẩn hóa label + màu hiển thị role cho toàn app
const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-yellow-100 text-yellow-700" },
  STAFF: { label: "Staff", className: "bg-violet-100 text-violet-700" },
  CUSTOMER: { label: "Customer", className: "bg-green-100 text-green-700" },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: ROLE_CONFIG.ADMIN.label,
  STAFF: ROLE_CONFIG.STAFF.label,
  CUSTOMER: ROLE_CONFIG.CUSTOMER.label,
};

export function RoleBadge({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  const { label, className: colorClass } = ROLE_CONFIG[role];
  return (
    <span
      className={cn(
        "w-fit rounded-md px-2 py-0.5 text-xs font-medium",
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
