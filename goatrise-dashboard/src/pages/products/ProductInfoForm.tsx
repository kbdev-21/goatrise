import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { cn } from "@/lib/utils";
import { formatPriceVn, normalizeVietnameseString } from "@/core/utils.ts";
import type { Item } from "@/api/item/api.ts";
import { Switch } from "@/components/ui/switch.tsx";
import { ItemAttributeBadges } from "@/components/shared/item-attribute-badges.tsx";

export type ProductInfoFormValue = {
  slug: string;
  titleEn: string;
  titleVi: string;
  shortDescriptionEn: string;
  shortDescriptionVi: string;
  markdownDescriptionEn: string;
  markdownDescriptionVi: string;
  imgUrls: string[];
  comparePrice: string;
  comparePriceEnabled: boolean;
  isActive: boolean;
  colorRequired: boolean;
  sizeRequired: boolean;
  itemIds: string[];
};

export const EMPTY_PRODUCT_INFO_FORM_VALUE: ProductInfoFormValue = {
  slug: "",
  titleEn: "",
  titleVi: "",
  shortDescriptionEn: "",
  shortDescriptionVi: "",
  markdownDescriptionEn: "",
  markdownDescriptionVi: "",
  imgUrls: [],
  comparePrice: "",
  comparePriceEnabled: false,
  isActive: true,
  colorRequired: false,
  sizeRequired: false,
  itemIds: [],
};

export default function ProductInfoForm({
  value,
  onChange,
  items,
}: {
  value: ProductInfoFormValue;
  onChange: (value: ProductInfoFormValue) => void;
  items: Item[];
}) {
  const set = (patch: Partial<ProductInfoFormValue>) => onChange({ ...value, ...patch });

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [shortDescLang, setShortDescLang] = useState<"en" | "vi">("vi");
  const [markdownDescLang, setMarkdownDescLang] = useState<"en" | "vi">("vi");

  const setImgUrl = (index: number, url: string) =>
    set({ imgUrls: value.imgUrls.map((u, i) => (i === index ? url : u)) });
  const addImgUrl = () => set({ imgUrls: [...value.imgUrls, ""] });
  const removeImgUrl = (index: number) =>
    set({ imgUrls: value.imgUrls.filter((_, i) => i !== index) });

  const addItemId = (itemId: string) => {
    const imgUrl = items.find((it) => it.id === itemId)?.imgUrl;
    const shouldAddImg = !!imgUrl && !value.imgUrls.includes(imgUrl);
    set({
      itemIds: [...value.itemIds, itemId],
      imgUrls: shouldAddImg ? [...value.imgUrls, imgUrl] : value.imgUrls,
    });
  };
  const removeItemId = (itemId: string) =>
    set({ itemIds: value.itemIds.filter((id) => id !== itemId) });

  const selectedItems = value.itemIds
    .map((id) => items.find((it) => it.id === id))
    .filter((it): it is Item => !!it);

  return (
    <>
      <div className="flex items-start gap-4">
        {/* ----- card 1: info thường ----- */}
        <div className="bg-card flex flex-1 flex-col gap-4 rounded-md border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Info</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Active</span>
            <Switch
              checked={value.isActive}
              onCheckedChange={(v) => set({ isActive: v })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Title</FieldLabel>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="VI"
              value={value.titleVi}
              onChange={(e) => set({ titleVi: e.target.value })}
            />
            <Input
              placeholder="EN"
              value={value.titleEn}
              onChange={(e) => set({ titleEn: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Slug</FieldLabel>
          <Input
            placeholder="e.g. classic-tee"
            value={value.slug}
            onChange={(e) => set({ slug: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <FieldLabel required>Short description</FieldLabel>
            <LangToggle lang={shortDescLang} onChange={setShortDescLang} />
          </div>
          <Textarea
            placeholder={shortDescLang === "en" ? "EN" : "VI"}
            value={shortDescLang === "en" ? value.shortDescriptionEn : value.shortDescriptionVi}
            onChange={(e) =>
              set(
                shortDescLang === "en"
                  ? { shortDescriptionEn: e.target.value }
                  : { shortDescriptionVi: e.target.value },
              )
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <FieldLabel>Markdown description</FieldLabel>
            <LangToggle lang={markdownDescLang} onChange={setMarkdownDescLang} />
          </div>
          <Textarea
            placeholder={markdownDescLang === "en" ? "EN" : "VI"}
            value={markdownDescLang === "en" ? value.markdownDescriptionEn : value.markdownDescriptionVi}
            onChange={(e) =>
              set(
                markdownDescLang === "en"
                  ? { markdownDescriptionEn: e.target.value }
                  : { markdownDescriptionVi: e.target.value },
              )
            }
          />
        </div>

        {/* TODO: tạm nhập URL trực tiếp; thay bằng image upload sau */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Image URLs</FieldLabel>
          <div className="flex flex-col gap-2">
            {value.imgUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setImgUrl(index, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove image URL"
                  onClick={() => removeImgUrl(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={addImgUrl}
            >
              <Plus className="size-4" />
              Add image URL
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={value.comparePriceEnabled}
                onCheckedChange={(v) => set({ comparePriceEnabled: v === true })}
              />
              <FieldLabel>Compare price</FieldLabel>
            </div>
            <Input
              type="number"
              min={0}
              placeholder={value.comparePriceEnabled ? "0" : "null (not set)"}
              value={value.comparePriceEnabled ? value.comparePrice : ""}
              disabled={!value.comparePriceEnabled}
              onChange={(e) => set({ comparePrice: e.target.value })}
            />
          </div>

        </div>
      </div>

        {/* ----- card 2: requiredAttributes + itemIds ----- */}
        <div className="bg-card flex w-[30rem] shrink-0 flex-col gap-4 rounded-md border p-6">
        <h2 className="text-base font-medium">Attributes & Items</h2>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Required attributes</FieldLabel>
          <div className="flex gap-4 rounded-md border p-3">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={value.colorRequired}
                onCheckedChange={(v) => set({ colorRequired: v === true })}
              />
              <span className="text-xs font-medium">Color</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={value.sizeRequired}
                onCheckedChange={(v) => set({ sizeRequired: v === true })}
              />
              <span className="text-xs font-medium">Size</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Items ({selectedItems.length} selected)</FieldLabel>
          <div className="flex flex-col gap-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-md border p-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium">{item.name}</span>
                    <span className="text-muted-foreground shrink-0 font-mono text-xs">
                      {item.sku}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatPriceVn(item.price)} VND
                  </span>
                  <ItemAttributeBadges attributeValues={item.attributeValues} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove item"
                  onClick={() => removeItemId(item.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setItemDialogOpen(true)}
            >
              <Plus className="size-4" />
              Add item
            </Button>
          </div>
        </div>
        </div>
      </div>

      <AddItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        items={items}
        selectedIds={value.itemIds}
        onAdd={addItemId}
      />
    </>
  );
}

function AddItemDialog({
  open,
  onOpenChange,
  items,
  selectedIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  selectedIds: string[];
  onAdd: (itemId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const availableItems = items.filter((item) => !selectedIds.includes(item.id));
  const keyword = normalizeVietnameseString(search.trim());
  const filteredItems = keyword
    ? availableItems.filter((item) =>
        normalizeVietnameseString(`${item.name} ${item.sku}`).includes(keyword),
      )
    : availableItems;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSearch("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            placeholder="Search name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
          <Search className="text-muted-foreground absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
        </div>

        <div className="max-h-96 overflow-auto rounded-md border">
          {filteredItems.length === 0 ? (
            <div className="text-muted-foreground p-3 text-center text-xs">
              No items found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAdd(item.id)}
                className="hover:bg-muted/50 flex w-full flex-col gap-1 border-b px-3 py-2 text-left last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium">{item.name}</span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {item.sku}
                  </span>
                  <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                    {formatPriceVn(item.price)} VND
                  </span>
                </div>
                <ItemAttributeBadges attributeValues={item.attributeValues} />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LangToggle({
  lang,
  onChange,
}: {
  lang: "en" | "vi";
  onChange: (lang: "en" | "vi") => void;
}) {
  const activeClass = "bg-foreground! text-background! hover:bg-foreground/90!";
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn("h-5 px-1.5 text-[10px] leading-none", lang === "vi" && activeClass)}
        onClick={() => onChange("vi")}
      >
        VI
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn("h-5 px-1.5 text-[10px] leading-none", lang === "en" && activeClass)}
        onClick={() => onChange("en")}
      >
        EN
      </Button>
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
