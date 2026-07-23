import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { NewImageDialog } from "@/components/shared/new-image-dialog.tsx";
import { ImageThumbnail } from "@/components/shared/image-thumbnail.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import type { Product } from "@/api/product/api.ts";

const PRODUCT_NONE = "NONE";

export type ItemInfoFormValue = {
  sku: string;
  name: string;
  productId: string | null; // display-only
  price: string;
  weight: string;
  displayPriority: string;
  imgUrl: string;
  note: string;
  isActive: boolean;
  colorEnabled: boolean;
  color: string;
  sizeEnabled: boolean;
  size: string;
};

export const EMPTY_ITEM_INFO_FORM_VALUE: ItemInfoFormValue = {
  sku: "",
  name: "",
  productId: null,
  price: "",
  weight: "",
  displayPriority: "1",
  imgUrl: "",
  note: "",
  isActive: true,
  colorEnabled: true,
  color: "",
  sizeEnabled: true,
  size: "",
};

export default function ItemInfoForm({
  value,
  onChange,
  products,
}: {
  value: ItemInfoFormValue;
  onChange: (value: ItemInfoFormValue) => void;
  products: Product[];
}) {
  const set = (patch: Partial<ItemInfoFormValue>) => onChange({ ...value, ...patch });

  const [imgDialogOpen, setImgDialogOpen] = useState(false);

  return (
    <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">Info</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Active</span>
          <Switch checked={value.isActive} onCheckedChange={(v) => set({ isActive: v })} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>SKU</FieldLabel>
        <Input
          placeholder="e.g. SKU-001"
          value={value.sku}
          onChange={(e) => set({ sku: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Name</FieldLabel>
        <Input
          placeholder="Item name"
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Product</FieldLabel>
        <Select
          value={value.productId ?? PRODUCT_NONE}
          onValueChange={(v) => set({ productId: v === PRODUCT_NONE ? null : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PRODUCT_NONE}>No product</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.title.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Price</FieldLabel>
        <Input
          type="number"
          min={0}
          placeholder="0"
          value={value.price}
          onChange={(e) => set({ price: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Weight</FieldLabel>
        <Input
          type="number"
          min={0}
          placeholder="Gram"
          value={value.weight}
          onChange={(e) => set({ weight: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Display priority</FieldLabel>
        <Input
          type="number"
          placeholder="1"
          value={value.displayPriority}
          onChange={(e) => set({ displayPriority: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Image</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          {value.imgUrl ? (
            <ImageThumbnail url={value.imgUrl} onRemove={() => set({ imgUrl: "" })} />
          ) : (
            <button
              type="button"
              aria-label="Add image"
              className="text-muted-foreground hover:border-foreground/30 hover:text-foreground flex size-20 shrink-0 items-center justify-center rounded-md border border-dashed"
              onClick={() => setImgDialogOpen(true)}
            >
              <ImagePlus className="size-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Note</FieldLabel>
        <Input
          placeholder="Short description"
          value={value.note}
          onChange={(e) => set({ note: e.target.value })}
        />
      </div>


      <div className="flex flex-col gap-1.5">
        <FieldLabel>Attributes</FieldLabel>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          {/* COLOR */}
          <div className="flex items-center gap-3">
            <label className="flex w-20 shrink-0 items-center gap-2">
              <Checkbox
                checked={value.colorEnabled}
                onCheckedChange={(v) => set({ colorEnabled: v === true })}
              />
              <span className="text-xs font-medium">Color</span>
            </label>
            <div className="flex-1">
              <Input
                placeholder="Hex (#ffffff)"
                value={value.color}
                disabled={!value.colorEnabled}
                onChange={(e) => set({ color: e.target.value })}
              />
            </div>
          </div>

          {/* SIZE */}
          <div className="flex items-center gap-3">
            <label className="flex w-20 shrink-0 items-center gap-2">
              <Checkbox
                checked={value.sizeEnabled}
                onCheckedChange={(v) => set({ sizeEnabled: v === true })}
              />
              <span className="text-xs font-medium">Size</span>
            </label>
            <div className="flex-1">
              <Input
                placeholder="e.g. M, 42"
                value={value.size}
                disabled={!value.sizeEnabled}
                onChange={(e) => set({ size: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      <NewImageDialog
        open={imgDialogOpen}
        onOpenChange={setImgDialogOpen}
        onConfirm={(url) => set({ imgUrl: url })}
      />
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-medium">
      {children}{" "}
      {required ? (
        <span className="text-destructive">*</span>
      ) : (
        <span className="text-muted-foreground text-xs font-normal">
          (optional)
        </span>
      )}
    </label>
  );
}
