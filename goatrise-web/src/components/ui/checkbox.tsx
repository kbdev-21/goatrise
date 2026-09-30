import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  // có label thì bọc cả dòng, bấm vào chữ cũng tick được
  label?: React.ReactNode;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  const box = (
    <CheckboxPrimitive.Root
      id={id}
      checked={checked}
      // Radix trả về boolean | "indeterminate"; ở đây chỉ dùng 2 trạng thái
      onCheckedChange={(next) => onCheckedChange(next === true)}
      disabled={disabled}
      className={cn(
        "peer flex size-4 shrink-0 cursor-pointer items-center justify-center border border-foreground/35 bg-background outline-none transition-colors duration-200",
        "hover:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[state=checked]:border-foreground data-[state=checked]:bg-foreground",
        "disabled:cursor-not-allowed disabled:opacity-40",
        !label && className
      )}
    >
      {/* luôn mount để dấu tick có hiệu ứng cả lúc hiện lẫn lúc ẩn */}
      <CheckboxPrimitive.Indicator
        forceMount
        className="flex text-background transition-[opacity,scale] duration-200 ease-out data-[state=checked]:scale-100 data-[state=checked]:opacity-100 data-[state=unchecked]:scale-50 data-[state=unchecked]:opacity-0"
      >
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label) {
    return box;
  }

  return (
    <label
      className={cn(
        "group flex cursor-pointer items-center gap-3 py-1.5 text-sm select-none has-disabled:cursor-not-allowed",
        className
      )}
    >
      {box}
      <span
        className={cn(
          "transition-opacity duration-200 group-hover:opacity-100 peer-disabled:opacity-40",
          checked ? "opacity-100" : "opacity-70"
        )}
      >
        {label}
      </span>
    </label>
  );
}
