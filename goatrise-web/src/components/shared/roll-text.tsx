import { cn } from "@/lib/utils";

/**
 * Chữ cuộn khi hover: bản gốc trượt lên, bản sao trượt vào đúng vị trí cũ.
 * Đặt trong phần tử có class `group` thì hover cả khối cũng kích hoạt được.
 */
export function RollText({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("roll", className)} data-text={label}>
      <span>{label}</span>
    </span>
  );
}
