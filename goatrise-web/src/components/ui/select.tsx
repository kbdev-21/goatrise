import { Select as SelectPrimitive } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectItem = {
  value: string;
  label: string;
  // chấm màu hiện cạnh nhãn (dùng cho filter màu)
  swatch?: string;
};

export function Select({
  items,
  value,
  onChange,
  label,
  showLabel = true,
  id,
  className,
}: {
  items: SelectItem[];
  value: string;
  onChange: (value: string) => void;
  // tiền tố trên nút, vd "Màu sắc: Đen"
  label: string;
  // false: ẩn tiền tố (vd đã có tiêu đề riêng bên ngoài), vẫn giữ aria-label
  showLabel?: boolean;
  id?: string;
  className?: string;
}) {
  const selected = items.find((item) => item.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={label}
        className={cn(
          "flex h-10 min-w-0 cursor-pointer items-center justify-between gap-2 border border-border bg-background px-3 text-left text-[11px] font-bold tracking-[0.08em] uppercase outline-none transition-colors hover:border-foreground focus-visible:border-foreground data-[state=open]:border-foreground",
          className
        )}
      >
        <span className="truncate">
          {showLabel ? (
            <>
              <span className="text-muted-foreground">{label}:</span>{" "}
            </>
          ) : null}
          <SelectPrimitive.Value>{selected?.label}</SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          align="start"
          sideOffset={-1}
          // Lenis chặn wheel ở document, phải nhả ra để danh sách tự cuộn được
          data-lenis-prevent
          className="z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden border border-foreground bg-background shadow-lg"
        >
          <SelectPrimitive.Viewport className="py-1">
            {items.map((item) => (
              <SelectPrimitive.Item
                key={item.value}
                value={item.value}
                className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm outline-none select-none data-[highlighted]:bg-muted"
              >
                <SelectPrimitive.ItemText>
                  <span className="flex items-center gap-2">
                    {item.swatch ? (
                      <span
                        aria-hidden
                        style={{ backgroundColor: item.swatch }}
                        className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/30 ring-inset"
                      />
                    ) : null}
                    {item.label}
                  </span>
                </SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check className="size-3.5 shrink-0" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
