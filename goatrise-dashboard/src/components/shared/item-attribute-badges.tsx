import type { ItemAttributeValues } from "@/api/item/api.ts";
import { capitalize, getColorName } from "@/core/utils.ts";

// badge thuộc tính biến thể (COLOR hex + SIZE) dùng chung cho items, products, orders
export function ItemAttributeBadges({
  attributeValues,
}: {
  attributeValues?: ItemAttributeValues;
}) {
  const color = attributeValues?.COLOR;
  const size = attributeValues?.SIZE;

  if (!color && !size) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {color && (
        <span
          className="bg-muted flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
          title={color}
        >
          <span className="size-3 rounded-full border" style={{ backgroundColor: color }} />
          {capitalize(getColorName(color))}
        </span>
      )}
      {size && <span className="bg-muted rounded px-1.5 py-0.5 text-xs">Size {size}</span>}
    </div>
  );
}
