import { useEffect, useMemo, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type ComboboxItem = {
  value: string;
  label: string;
};

// bỏ dấu để gõ "da nang" vẫn ra "Đà Nẵng"
function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function Combobox({
  items,
  value,
  onChange,
  id,
  placeholder = "Chọn",
  searchPlaceholder = "Tìm kiếm…",
  emptyText = "Không tìm thấy kết quả",
  className,
}: {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = items.find((item) => item.value === value);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) {
      return items;
    }
    return items.filter((item) => normalize(item.label).includes(q));
  }, [items, query]);

  // mỗi lần lọc lại thì con trỏ về đầu danh sách cho khỏi trỏ ra ngoài
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // giữ item đang active luôn nằm trong vùng nhìn thấy khi dùng phím
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, filtered]);

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-11 w-full cursor-pointer items-center justify-between gap-2 border border-border bg-background px-3 text-left text-sm outline-none transition-colors focus:border-foreground data-[state=open]:border-foreground",
            className
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={-1}
          className="z-50 w-[var(--radix-popover-trigger-width)] border border-foreground bg-background shadow-lg"
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full border-b border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (activeIndex < filtered.length) {
                  select(filtered[activeIndex].value);
                }
              }
            }}
          />

          <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">{emptyText}</p>
            ) : (
              filtered.map((item, index) => (
                <button
                  key={item.value}
                  type="button"
                  data-index={index}
                  onClick={() => select(item.value)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                    index === activeIndex && "bg-muted"
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  {item.value === value ? (
                    <Check className="size-3.5 shrink-0" />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
