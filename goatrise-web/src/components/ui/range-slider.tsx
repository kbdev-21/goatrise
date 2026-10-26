import { Slider as SliderPrimitive } from "radix-ui";

import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export type Range = [number, number];

// Thanh trượt 2 nút kéo (min / max), dùng cho lọc theo khoảng
export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  onValueCommit,
  thumbLabels: thumbLabelsProp,
  className,
}: {
  value: Range;
  min: number;
  max: number;
  step?: number;
  // chạy liên tục khi đang kéo
  onValueChange: (value: Range) => void;
  // chạy một lần khi thả tay / đổi bằng bàn phím
  onValueCommit?: (value: Range) => void;
  thumbLabels?: [string, string];
  className?: string;
}) {
  const t = useT();
  const thumbLabels = thumbLabelsProp ?? [
    t.ui.rangeSlider.min,
    t.ui.rangeSlider.max,
  ];

  return (
    <SliderPrimitive.Root
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={([from, to]) => onValueChange([from, to])}
      onValueCommit={([from, to]) => onValueCommit?.([from, to])}
      className={cn(
        "relative flex h-5 w-full touch-none items-center select-none",
        className
      )}
    >
      <SliderPrimitive.Track className="relative h-0.5 w-full grow overflow-hidden bg-border">
        <SliderPrimitive.Range className="absolute h-full bg-foreground" />
      </SliderPrimitive.Track>

      {thumbLabels.map((label) => (
        <SliderPrimitive.Thumb
          key={label}
          aria-label={label}
          className="block size-3.5 cursor-grab rounded-full border border-foreground bg-background shadow-sm outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-foreground/30 active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
