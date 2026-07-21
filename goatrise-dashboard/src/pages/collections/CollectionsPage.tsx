import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
} from "@/api/collection/query-hooks.ts";
import type {
  Collection,
  CollectionType,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "@/api/collection/api.ts";
import { useProducts } from "@/api/product/query-hooks.ts";
import { capitalize, normalizeVietnameseString } from "@/core/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { ActiveBadge } from "@/components/shared/active-badge.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

const TYPE_OPTIONS: { label: string; value: CollectionType }[] = [
  { label: "Collection", value: "COLLECTION" },
  { label: "Category", value: "CATEGORY" },
  { label: "Event", value: "EVENT" },
];

const TYPE_ALL = "ALL";

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Priority (high→low)", value: "priority:DESC" },
  { label: "Priority (low→high)", value: "priority:ASC" },
];

export default function CollectionsPage() {
  // ----- client-side query state -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<CollectionType | typeof TYPE_ALL>(TYPE_ALL);
  const [sort, setSort] = useState<string>("createdAt:DESC");

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

  // fetch toàn bộ 1 lần rồi filter phía client
  const collectionsQuery = useCollections();

  function commitSearch() {
    setSearch(searchInput.trim());
  }

  function openCreateDialog() {
    setEditingCollection(null);
    setIsFormDialogOpen(true);
  }

  function openEditDialog(collection: Collection) {
    setEditingCollection(collection);
    setIsFormDialogOpen(true);
  }

  const filteredCollections = useMemo(() => {
    const collections = collectionsQuery.data ?? [];
    const keyword = normalizeVietnameseString(search);
    return collections.filter((collection) => {
      if (type !== TYPE_ALL && collection.type !== type) return false;
      if (!keyword) return true;
      return normalizeVietnameseString(
        `${collection.slug} ${collection.title.en} ${collection.title.vi}`,
      ).includes(keyword);
    });
  }, [collectionsQuery.data, search, type]);

  const sortedCollections = useMemo(() => {
    const [field, direction] = sort.split(":");
    const factor = direction === "ASC" ? 1 : -1;
    return [...filteredCollections].sort((a, b) => {
      let cmp: number;
      switch (field) {
        case "priority":
          cmp = a.priority - b.priority;
          break;
        default:
          cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return cmp * factor;
    });
  }, [filteredCollections, sort]);

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Collections</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search slug or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSearch();
            }}
            className="bg-card pr-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={commitSearch}
            aria-label="Search"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <Search className="size-3.5" />
          </Button>
        </div>

        <Select
          value={type}
          onValueChange={(value) => setType(value as CollectionType | typeof TYPE_ALL)}
        >
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TYPE_ALL}>All types</SelectItem>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-48 bg-card">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" className="ml-auto" onClick={openCreateDialog}>
          <Plus className="size-4" />
          New Collection
        </Button>
      </div>

      {/* ----- table ----- */}
      {collectionsQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectionsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-destructive text-center">
                    Failed to load collections.
                  </TableCell>
                </TableRow>
              ) : sortedCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No collections found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell className="font-mono text-xs">{collection.slug}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CollectionImage collection={collection} />
                        <span>{collection.title.en}</span>
                      </div>
                    </TableCell>
                    <TableCell>{capitalize(collection.type)}</TableCell>
                    <TableCell>
                      {collection.products.length} product
                      {collection.products.length === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell>{collection.priority}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={collection.isActive} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit collection"
                          title="Edit collection"
                          onClick={() => openEditDialog(collection)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete collection"
                          title="Delete collection"
                          onClick={() => setDeletingCollection(collection)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ----- footer ----- */}
      <span className="text-muted-foreground text-xs">
        {filteredCollections.length} collection
        {filteredCollections.length === 1 ? "" : "s"}
        {collectionsQuery.isFetching ? " · updating..." : ""}
      </span>

      <CollectionFormDialog
        open={isFormDialogOpen}
        collection={editingCollection}
        onClose={() => setIsFormDialogOpen(false)}
      />

      <DeleteCollectionDialog
        collection={deletingCollection}
        onClose={() => setDeletingCollection(null)}
      />
    </div>
  );
}

type CollectionFormState = {
  slug: string;
  type: CollectionType;
  titleVi: string;
  titleEn: string;
  shortDescriptionVi: string;
  shortDescriptionEn: string;
  imgUrl: string;
  isActive: boolean;
  priority: string;
  productIds: string[];
};

const EMPTY_FORM_STATE: CollectionFormState = {
  slug: "",
  type: "COLLECTION",
  titleVi: "",
  titleEn: "",
  shortDescriptionVi: "",
  shortDescriptionEn: "",
  imgUrl: "",
  isActive: true,
  priority: "0",
  productIds: [],
};

function CollectionFormDialog({
  open,
  collection,
  onClose,
}: {
  open: boolean;
  collection: Collection | null;
  onClose: () => void;
}) {
  const isEdit = collection !== null;
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const productsQuery = useProducts();
  const products = productsQuery.data ?? [];

  const [form, setForm] = useState<CollectionFormState>(EMPTY_FORM_STATE);
  const [productSearch, setProductSearch] = useState("");
  // Select portal ra ngoài dialog -> click đóng dropdown bị Dialog hiểu nhầm là
  // click ngoài. Bỏ qua close oan bằng cách track select đang mở / vừa đóng.
  const selectOpenRef = useRef(false);
  const selectClosedAtRef = useRef(0);

  const set = (patch: Partial<CollectionFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  // reset form mỗi khi mở dialog (theo collection đang sửa hoặc rỗng khi tạo mới)
  useEffect(() => {
    if (!open) return;
    setProductSearch("");
    if (collection) {
      setForm({
        slug: collection.slug,
        type: collection.type,
        titleVi: collection.title.vi,
        titleEn: collection.title.en,
        shortDescriptionVi: collection.shortDescription.vi,
        shortDescriptionEn: collection.shortDescription.en,
        imgUrl: collection.imgUrl ?? "",
        isActive: collection.isActive,
        priority: String(collection.priority),
        productIds: collection.products.map((product) => product.id),
      });
    } else {
      setForm(EMPTY_FORM_STATE);
    }
  }, [open, collection]);

  const canSubmit =
    form.slug.trim().length > 0 &&
    form.titleVi.trim().length > 0 &&
    form.titleEn.trim().length > 0 &&
    form.shortDescriptionVi.trim().length > 0 &&
    form.shortDescriptionEn.trim().length > 0;

  const toggleProduct = (productId: string) =>
    set({
      productIds: form.productIds.includes(productId)
        ? form.productIds.filter((id) => id !== productId)
        : [...form.productIds, productId],
    });

  const keyword = normalizeVietnameseString(productSearch.trim());
  const filteredProducts = keyword
    ? products.filter((product) =>
        normalizeVietnameseString(
          `${product.slug} ${product.title.en} ${product.title.vi}`,
        ).includes(keyword),
      )
    : products;

  function handleSubmit() {
    const title = { vi: form.titleVi.trim(), en: form.titleEn.trim() };
    const shortDescription = {
      vi: form.shortDescriptionVi.trim(),
      en: form.shortDescriptionEn.trim(),
    };

    if (isEdit) {
      const request: UpdateCollectionRequest = {
        slug: form.slug.trim(),
        type: form.type,
        title: title,
        shortDescription: shortDescription,
        imgUrl: form.imgUrl.trim() || null,
        isActive: form.isActive,
        priority: Number(form.priority) || 0,
        productIds: form.productIds,
      };
      updateMutation.mutate(
        { collectionId: collection.id, request },
        {
          onSuccess: (updated) => {
            toast.success(`Updated collection ${updated.title.en}`);
            onClose();
          },
          onError: (error) => toast.error(errorMessage(error, "Failed to update collection")),
        },
      );
    } else {
      const request: CreateCollectionRequest = {
        slug: form.slug.trim(),
        type: form.type,
        title: title,
        shortDescription: shortDescription,
        imgUrl: form.imgUrl.trim() || undefined,
        isActive: form.isActive,
        priority: Number(form.priority) || 0,
        productIds: form.productIds.length > 0 ? form.productIds : undefined,
      };
      createMutation.mutate(request, {
        onSuccess: (created) => {
          toast.success(`Created collection ${created.title.en}`);
          onClose();
        },
        onError: (error) => toast.error(errorMessage(error, "Failed to create collection")),
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (selectOpenRef.current || Date.now() - selectClosedAtRef.current < 300) return;
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit collection" : "New collection"}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Title</FieldLabel>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="VI"
                value={form.titleVi}
                onChange={(e) => set({ titleVi: e.target.value })}
              />
              <Input
                placeholder="EN"
                value={form.titleEn}
                onChange={(e) => set({ titleEn: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Slug</FieldLabel>
              <Input
                placeholder="e.g. summer-sale"
                value={form.slug}
                onChange={(e) => set({ slug: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Type</FieldLabel>
              <Select
                value={form.type}
                onValueChange={(value) => set({ type: value as CollectionType })}
                onOpenChange={(selectOpen) => {
                  selectOpenRef.current = selectOpen;
                  if (!selectOpen) selectClosedAtRef.current = Date.now();
                }}
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
            <FieldLabel required>Short description</FieldLabel>
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="VI"
                value={form.shortDescriptionVi}
                onChange={(e) => set({ shortDescriptionVi: e.target.value })}
              />
              <Textarea
                placeholder="EN"
                value={form.shortDescriptionEn}
                onChange={(e) => set({ shortDescriptionEn: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Image URL</FieldLabel>
            <Input
              placeholder="https://..."
              value={form.imgUrl}
              onChange={(e) => set({ imgUrl: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Priority</FieldLabel>
            <Input
              type="number"
              placeholder="0"
              value={form.priority}
              onChange={(e) => set({ priority: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium">Active</span>
              <span className="text-muted-foreground text-xs">
                Inactive collections are hidden from the storefront.
              </span>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => set({ isActive: v })}
            />
          </div>

          {/* ----- product multi-select (thay toàn bộ products của collection) ----- */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Products ({form.productIds.length} selected)</FieldLabel>
            <div className="relative">
              <Input
                placeholder="Search slug or name..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pr-9"
              />
              <Search className="text-muted-foreground absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
            </div>
            <div className="max-h-56 overflow-auto rounded-md border">
              {productsQuery.isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Spinner className="text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-muted-foreground p-3 text-center text-xs">
                  No products found.
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <label
                    key={product.id}
                    className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2 last:border-b-0"
                  >
                    <Checkbox
                      checked={form.productIds.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                    <span className="truncate text-xs font-medium">{product.title.en}</span>
                    <span className="text-muted-foreground ml-auto shrink-0 font-mono text-xs">
                      {product.slug}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
            {isPending && <Spinner />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCollectionDialog({
  collection,
  onClose,
}: {
  collection: Collection | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteCollection();

  return (
    <Dialog open={collection !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete collection</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          Are you sure you want to delete{" "}
          <span className="text-foreground font-medium">{collection?.title.en}</span>? This
          only removes the collection and its product links, not the products themselves.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (!collection) return;
              deleteMutation.mutate(collection.id, {
                onSuccess: () => {
                  toast.success(`Deleted collection ${collection.title.en}`);
                  onClose();
                },
                onError: (error) =>
                  toast.error(errorMessage(error, "Failed to delete collection")),
              });
            }}
          >
            {deleteMutation.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) ? error.response?.data || error.message : fallback;
}

function CollectionImage({ collection }: { collection: Collection }) {
  const [error, setError] = useState(false);
  return collection.imgUrl && !error ? (
    <img
      src={collection.imgUrl}
      alt={collection.title.en}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="size-8 shrink-0 rounded object-cover"
    />
  ) : (
    <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded">
      <ImageOff className="size-4" />
    </div>
  );
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium">
      {children}{" "}
      {required ? (
        <span className="text-destructive">*</span>
      ) : (
        <span className="text-muted-foreground text-xs font-normal">(optional)</span>
      )}
    </label>
  );
}
