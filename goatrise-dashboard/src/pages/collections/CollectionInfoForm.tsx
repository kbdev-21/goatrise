import { type ReactNode, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils";
import { normalizeVietnameseString } from "@/core/utils.ts";
import type { Collection, CollectionType } from "@/api/collection/api.ts";
import type { Product } from "@/api/product/api.ts";
import { Switch } from "@/components/ui/switch.tsx";
import { ActiveBadge } from "@/components/shared/active-badge.tsx";
import { ImageUploadButton } from "@/components/shared/image-upload-button.tsx";
import { ImageThumbnail } from "@/components/shared/image-thumbnail.tsx";

const TYPE_OPTIONS: { label: string; value: CollectionType }[] = [
  { label: "Collection", value: "COLLECTION" },
  { label: "Category", value: "CATEGORY" },
  { label: "Event", value: "EVENT" },
];

// Sentinel cho option "None" (Radix Select không nhận value rỗng)
const NO_PARENT_VALUE = "__NONE__";

export type CollectionInfoFormValue = {
  slug: string;
  type: CollectionType;
  parentId: string;
  titleEn: string;
  titleVi: string;
  shortDescriptionEn: string;
  shortDescriptionVi: string;
  imgUrl: string;
  displayPriority: string;
  isActive: boolean;
  isFeatured: boolean;
  productIds: string[];
};

export const EMPTY_COLLECTION_INFO_FORM_VALUE: CollectionInfoFormValue = {
  slug: "",
  type: "COLLECTION",
  parentId: "",
  titleEn: "",
  titleVi: "",
  shortDescriptionEn: "",
  shortDescriptionVi: "",
  imgUrl: "",
  displayPriority: "0",
  isActive: true,
  isFeatured: false,
  productIds: [],
};

export default function CollectionInfoForm({
  value,
  onChange,
  products = [],
  collections = [],
  currentCollectionId,
}: {
  value: CollectionInfoFormValue;
  onChange: (value: CollectionInfoFormValue) => void;
  products: Product[];
  collections: Collection[];
  currentCollectionId?: string;
}) {
  const set = (patch: Partial<CollectionInfoFormValue>) => onChange({ ...value, ...patch });

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [shortDescLang, setShortDescLang] = useState<"en" | "vi">("vi");

  const addProductId = (productId: string) =>
    set({ productIds: [...value.productIds, productId] });
  const removeProductId = (productId: string) =>
    set({ productIds: value.productIds.filter((id) => id !== productId) });

  const selectedProducts = value.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  // Ứng viên làm cha: loại chính nó + toàn bộ hậu duệ (tránh cycle)
  const excludedIds = collectDescendantIds(collections, currentCollectionId);
  const parentOptions = collections.filter((c) => !excludedIds.has(c.id));

  return (
    <>
      <div className="flex items-start gap-4">
        {/* ----- card 1: info thường ----- */}
        <div className="bg-card flex flex-1 flex-col gap-4 rounded-md border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Info</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Featured</span>
                <Switch
                  checked={value.isFeatured}
                  onCheckedChange={(v) => set({ isFeatured: v })}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Active</span>
                <Switch
                  checked={value.isActive}
                  onCheckedChange={(v) => set({ isActive: v })}
                />
              </div>
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

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Slug</FieldLabel>
              <Input
                placeholder="e.g. summer-sale"
                value={value.slug}
                onChange={(e) => set({ slug: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Type</FieldLabel>
              <Select
                value={value.type}
                onValueChange={(v) => set({ type: v as CollectionType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Parent collection</FieldLabel>
            <Select
              value={value.parentId || NO_PARENT_VALUE}
              onValueChange={(v) =>
                set({ parentId: v === NO_PARENT_VALUE ? "" : v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT_VALUE}>None</SelectItem>
                {parentOptions.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.title.vi || collection.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <FieldLabel required>Short description</FieldLabel>
              <LangToggle lang={shortDescLang} onChange={setShortDescLang} />
            </div>
            <Textarea
              placeholder={shortDescLang === "en" ? "EN" : "VI"}
              value={
                shortDescLang === "en" ? value.shortDescriptionEn : value.shortDescriptionVi
              }
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
            <FieldLabel>Image</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {value.imgUrl ? (
                <ImageThumbnail url={value.imgUrl} onRemove={() => set({ imgUrl: "" })} />
              ) : (
                <ImageUploadButton onUpload={(url) => set({ imgUrl: url })} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Display priority</FieldLabel>
              <Input
                type="number"
                placeholder="0"
                value={value.displayPriority}
                onChange={(e) => set({ displayPriority: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* ----- card 2: productIds ----- */}
        <div className="bg-card flex w-[30rem] shrink-0 flex-col gap-4 rounded-md border p-6">
          <h2 className="text-base font-medium">Products</h2>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Products ({selectedProducts.length} selected)</FieldLabel>
            <div className="flex flex-col gap-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-start justify-between gap-2 rounded-md border p-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {product.imgUrls?.[0] && (
                      <ImageThumbnail
                        url={product.imgUrls[0]}
                        alt={product.title.vi}
                        className="size-10"
                      />
                    )}
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-medium">
                          {product.title.vi}
                        </span>
                        <ActiveBadge isActive={product.isActive} />
                      </div>
                      <span className="text-muted-foreground font-mono text-xs">
                        {product.slug}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove product"
                    onClick={() => removeProductId(product.id)}
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
                onClick={() => setProductDialogOpen(true)}
              >
                <Plus className="size-4" />
                Add product
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        products={products}
        selectedIds={value.productIds}
        onAdd={addProductId}
      />
    </>
  );
}

function AddProductDialog({
  open,
  onOpenChange,
  products,
  selectedIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  selectedIds: string[];
  onAdd: (productId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const availableProducts = products.filter((product) => !selectedIds.includes(product.id));
  const keyword = normalizeVietnameseString(search.trim());
  const filteredProducts = keyword
    ? availableProducts.filter((product) =>
        normalizeVietnameseString(
          `${product.slug} ${product.title.en} ${product.title.vi}`,
        ).includes(keyword),
      )
    : availableProducts;

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
          <DialogTitle>Add product</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Input
            placeholder="Search slug or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
          <Search className="text-muted-foreground absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
        </div>

        <div className="max-h-96 overflow-auto rounded-md border">
          {filteredProducts.length === 0 ? (
            <div className="text-muted-foreground p-3 text-center text-xs">
              No products found.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onAdd(product.id)}
                className="hover:bg-muted/50 flex w-full flex-col gap-1 border-b px-3 py-2 text-left last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium">{product.title.vi}</span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {product.slug}
                  </span>
                  <span className="ml-auto shrink-0">
                    <ActiveBadge isActive={product.isActive} />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Tập id cần loại khỏi lựa chọn cha: chính nó + toàn bộ hậu duệ (BFS theo parentId trên danh sách phẳng)
function collectDescendantIds(
  collections: Collection[],
  rootId: string | undefined,
): Set<string> {
  const excluded = new Set<string>();
  if (!rootId) return excluded;

  excluded.add(rootId);
  const queue = [rootId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    for (const collection of collections) {
      if (collection.parentId === currentId && !excluded.has(collection.id)) {
        excluded.add(collection.id);
        queue.push(collection.id);
      }
    }
  }

  return excluded;
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
  children: ReactNode;
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
