import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, Eye, ImageOff, PackagePlus, Plus, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useAdjustItemStock, useImportItem, useItems } from "@/api/item/query-hooks.ts";
import type { AdjustItemStockRequest, ImportItemRequest, Item } from "@/api/item/api.ts";
import { useSuppliers } from "@/api/supplier/query-hooks.ts";
import { formatPriceVn, normalizeVietnameseString } from "@/core/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
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

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "SKU (A→Z)", value: "sku:ASC" },
  { label: "SKU (Z→A)", value: "sku:DESC" },
  { label: "Name (A→Z)", value: "name:ASC" },
  { label: "Name (Z→A)", value: "name:DESC" },
  { label: "Price (Low→High)", value: "price:ASC" },
  { label: "Price (High→Low)", value: "price:DESC" },
  { label: "Stock (Low→High)", value: "stock:ASC" },
  { label: "Stock (High→Low)", value: "stock:DESC" },
  { label: "Sold (Low→High)", value: "sold:ASC" },
  { label: "Sold (High→Low)", value: "sold:DESC" },
];

export default function ItemsPage() {
  // ----- client-side query state -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("createdAt:DESC");
  const [importingItem, setImportingItem] = useState<Item | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);

  const navigate = useNavigate();

  // fetch toàn bộ 1 lần rồi filter phía client
  const itemsQuery = useItems();

  function commitSearch() {
    setSearch(searchInput.trim());
  }

  const filteredItems = useMemo(() => {
    const items = itemsQuery.data ?? [];
    const keyword = normalizeVietnameseString(search);
    if (!keyword) return items;
    return items.filter(
      (item) =>
        item.normalizedName.includes(keyword) ||
        item.sku.toLowerCase().includes(keyword),
    );
  }, [itemsQuery.data, search]);

  const sortedItems = useMemo(() => {
    const [field, direction] = sort.split(":");
    const factor = direction === "ASC" ? 1 : -1;
    return [...filteredItems].sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case "sku":
          cmp = a.sku.localeCompare(b.sku);
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "price":
          cmp = Number(a.price) - Number(b.price);
          break;
        case "stock":
          cmp = a.stock - b.stock;
          break;
        case "sold":
          cmp = a.sold - b.sold;
          break;
        default:
          cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return cmp * factor;
    });
  }, [filteredItems, sort]);

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Items</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search SKU or name..."
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

        <Button
          type="button"
          className="ml-auto"
          onClick={() => navigate("/items/create")}
        >
          <Plus className="size-4" />
          New Item
        </Button>
      </div>

      {/* ----- table ----- */}
      {itemsQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-destructive text-center">
                    Failed to load items.
                  </TableCell>
                </TableRow>
              ) : sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-center">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="font-medium">
                      <div
                        className="flex w-fit cursor-pointer items-center gap-2"
                        onClick={() => navigate(`/items/${item.id}`)}
                      >
                        <ItemImage item={item} />
                        <span className="hover:underline">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {item.attributeValues?.COLOR && (
                          <span className="bg-muted flex items-center gap-1 rounded px-1.5 py-0.5 text-xs">
                            <span
                              className="size-3 rounded-full border"
                              style={{ backgroundColor: item.attributeValues.COLOR.hex }}
                            />
                            {item.attributeValues.COLOR.enText}
                          </span>
                        )}
                        {item.attributeValues?.SIZE && (
                          <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                            Size {item.attributeValues.SIZE}
                          </span>
                        )}
                        {!item.attributeValues?.COLOR &&
                          !item.attributeValues?.SIZE && (
                            <span className="text-muted-foreground">—</span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>{item.product ? item.product.title.vi : "—"}</TableCell>
                    <TableCell>{formatPriceVn(item.price)}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{item.sold}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Import"
                          title="Import"
                          onClick={() => setImportingItem(item)}
                        >
                          <PackagePlus className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Adjust stock"
                          title="Adjust stock"
                          onClick={() => setAdjustingItem(item)}
                        >
                          <RefreshCcw className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View details"
                          title="View details"
                          onClick={() => navigate(`/items/${item.id}`)}
                        >
                          <Eye className="size-4" />
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
        {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
        {itemsQuery.isFetching ? " · updating..." : ""}
      </span>

      <ImportItemDialog
        item={importingItem}
        onClose={() => setImportingItem(null)}
        onSuccess={() => itemsQuery.refetch()}
      />

      <AdjustItemDialog
        item={adjustingItem}
        onClose={() => setAdjustingItem(null)}
        onSuccess={() => itemsQuery.refetch()}
      />
    </div>
  );
}

const SUPPLIER_NONE = "NONE";

function ImportItemDialog({
  item,
  onClose,
  onSuccess,
}: {
  item: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const importItemMutation = useImportItem();
  const suppliersQuery = useSuppliers();
  const [quantity, setQuantity] = useState("");
  const [importUnitCost, setImportUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState<string>(SUPPLIER_NONE);
  const [note, setNote] = useState("");
  // cùng lý do với các dialog khác: tránh thao tác select bị Dialog hiểu là click ngoài
  const selectOpenRef = useRef(false);
  const selectClosedAtRef = useRef(0);

  // reset form mỗi khi mở item khác
  useEffect(() => {
    if (item) {
      setQuantity("");
      setImportUnitCost("");
      setSupplierId(SUPPLIER_NONE);
      setNote("");
    }
  }, [item]);

  const canSubmit =
    Number(quantity) > 0 &&
    importUnitCost.trim().length > 0 &&
    Number(importUnitCost) >= 0;

  return (
    <Dialog
      open={!!item}
      onOpenChange={(next) => {
        if (next) return;
        if (selectOpenRef.current || Date.now() - selectClosedAtRef.current < 300) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import {item?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Quantity</FieldLabel>
            <Input
              type="number"
              min={1}
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Import unit cost</FieldLabel>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={importUnitCost}
              onChange={(e) => setImportUnitCost(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Supplier</FieldLabel>
            <Select
              value={supplierId}
              onValueChange={setSupplierId}
              onOpenChange={(selectOpen) => {
                selectOpenRef.current = selectOpen;
                if (!selectOpen) selectClosedAtRef.current = Date.now();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SUPPLIER_NONE}>No supplier</SelectItem>
                {(suppliersQuery.data ?? []).map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Note</FieldLabel>
            <Input
              placeholder="Short description"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importItemMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={importItemMutation.isPending || !canSubmit}
            onClick={() => {
              if (!item) return;
              const request: ImportItemRequest = {
                quantity: Number(quantity),
                importUnitCost: Number(importUnitCost),
                supplierId: supplierId !== SUPPLIER_NONE ? supplierId : undefined,
                note: note.trim() || undefined,
              };
              importItemMutation.mutate(
                { itemId: item.id, request },
                {
                  onSuccess: (updated) => {
                    toast.success(`Imported ${request.quantity} × ${updated.name}`);
                    onSuccess();
                    onClose();
                  },
                  onError: (error) => {
                    toast.error(
                      isAxiosError(error)
                        ? error.response?.data || error.message
                        : "Failed to import item",
                    );
                  },
                },
              );
            }}
          >
            {importItemMutation.isPending && <Spinner />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustItemDialog({
  item,
  onClose,
  onSuccess,
}: {
  item: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const adjustMutation = useAdjustItemStock();
  const [stockChange, setStockChange] = useState("");
  const [note, setNote] = useState("");

  // reset form mỗi khi mở item khác
  useEffect(() => {
    if (item) {
      setStockChange("");
      setNote("");
    }
  }, [item]);

  const canSubmit =
    stockChange.trim().length > 0 &&
    Number(stockChange) !== 0 &&
    note.trim().length > 0;

  return (
    <Dialog open={!!item} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust {item?.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Current stock:{" "}
            <span className="text-foreground font-medium">{item?.stock}</span>
          </p>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Stock change</FieldLabel>
            <Input
              type="number"
              placeholder="e.g. 10 or -5"
              value={stockChange}
              onChange={(e) => setStockChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Note</FieldLabel>
            <Input
              placeholder="Reason for adjustment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={adjustMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={adjustMutation.isPending || !canSubmit}
            onClick={() => {
              if (!item) return;
              const request: AdjustItemStockRequest = {
                stockChange: Number(stockChange),
                note: note.trim(),
              };
              adjustMutation.mutate(
                { itemId: item.id, request },
                {
                  onSuccess: (updated) => {
                    toast.success(
                      `Adjusted ${updated.name} to ${updated.stock}`,
                    );
                    onSuccess();
                    onClose();
                  },
                  onError: (error) => {
                    toast.error(
                      isAxiosError(error)
                        ? error.response?.data || error.message
                        : "Failed to adjust item",
                    );
                  },
                },
              );
            }}
          >
            {adjustMutation.isPending && <Spinner />}
            Adjust
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemImage({ item }: { item: Item }) {
  const [error, setError] = useState(false);
  return item.imgUrl && !error ? (
    <img
      src={item.imgUrl}
      alt={item.name}
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

function FieldLabel({
  children,
  required,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
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
