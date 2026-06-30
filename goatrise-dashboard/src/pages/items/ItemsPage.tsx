import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, Eye, History, ImageOff, PackagePlus, Plus, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useAdjustItemStock, useCreateItem, useImportItem, useItemTransactions, useItems } from "@/api/item/query-hooks.ts";
import type { AdjustItemStockRequest, CreateItemRequest, ImportItemRequest, Item, ItemTransactionType } from "@/api/item/api.ts";
import { useSuppliers } from "@/api/supplier/query-hooks.ts";
import { cn } from "@/lib/utils";
import { capitalize, normalizeVietnameseString } from "@/core/utils.ts";
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
  { label: "Stock (Low→High)", value: "stock:ASC" },
  { label: "Stock (High→Low)", value: "stock:DESC" },
];

export default function ItemsPage() {
  // ----- client-side query state -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("createdAt:DESC");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [importingItem, setImportingItem] = useState<Item | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

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
        case "stock":
          cmp = a.stock - b.stock;
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
          onClick={() => setIsCreateDialogOpen(true)}
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
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Status</TableHead>
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
                      <div className="flex items-center gap-2">
                        <ItemImage item={item} />
                        <span>{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.product ? item.product.title.vi : "—"}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{item.sold}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs",
                          item.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {capitalize(item.status)}
                      </span>
                    </TableCell>
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
                          aria-label="Transaction history"
                          title="Transaction history"
                          onClick={() => setHistoryItem(item)}
                        >
                          <History className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View details"
                          title="View details"
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

      <CreateItemDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => itemsQuery.refetch()}
      />

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

      <ItemTransactionHistoryDialog
        item={historyItem}
        onClose={() => setHistoryItem(null)}
      />
    </div>
  );
}

function CreateItemDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createItemMutation = useCreateItem();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [note, setNote] = useState("");

  // reset form mỗi khi mở lại dialog
  useEffect(() => {
    if (open) {
      setSku("");
      setName("");
      setWeight("");
      setImgUrl("");
      setNote("");
    }
  }, [open]);

  const canSubmit = sku.trim().length > 0 && name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>SKU</FieldLabel>
            <Input
              placeholder="e.g. SKU-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Name</FieldLabel>
            <Input
              placeholder="Item name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Weight</FieldLabel>
            <Input
              type="number"
              placeholder="Gram"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* TODO: thay text input bằng image upload */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Image URL</FieldLabel>
            <Input
              placeholder="https://..."
              value={imgUrl}
              onChange={(e) => setImgUrl(e.target.value)}
            />
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
            disabled={createItemMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={createItemMutation.isPending || !canSubmit}
            onClick={() => {
              const request: CreateItemRequest = {
                sku: sku.trim(),
                name: name.trim(),
                weight: weight ? Number(weight) : undefined,
                imgUrl: imgUrl.trim() || undefined,
                note: note.trim() || undefined,
              };
              createItemMutation.mutate(request, {
                onSuccess: (item) => {
                  toast.success(`Created item ${item.name}`);
                  onSuccess();
                  onClose();
                },
                onError: (error) => {
                  toast.error(
                    isAxiosError(error)
                      ? error.response?.data || error.message
                      : "Failed to create item",
                  );
                },
              });
            }}
          >
            {createItemMutation.isPending && <Spinner />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

const TRANSACTION_TYPE_ALL = "ALL";
const TRANSACTION_TYPE_OPTIONS: ItemTransactionType[] = ["IMPORT", "ADJUST", "SOLD"];

function ItemTransactionHistoryDialog({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  const [type, setType] = useState<ItemTransactionType | typeof TRANSACTION_TYPE_ALL>(
    TRANSACTION_TYPE_ALL,
  );
  // cùng lý do với các dialog khác: tránh thao tác select bị Dialog hiểu là click ngoài
  const selectOpenRef = useRef(false);
  const selectClosedAtRef = useRef(0);

  // reset filter mỗi khi mở item khác
  useEffect(() => {
    if (item) setType(TRANSACTION_TYPE_ALL);
  }, [item]);

  const transactionsQuery = useItemTransactions(item?.id ?? "", {
    type: type === TRANSACTION_TYPE_ALL ? undefined : type,
  });

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction history — {item?.name}</DialogTitle>
        </DialogHeader>

        <Select
          value={type}
          onValueChange={(value) =>
            setType(value as ItemTransactionType | typeof TRANSACTION_TYPE_ALL)
          }
          onOpenChange={(selectOpen) => {
            selectOpenRef.current = selectOpen;
            if (!selectOpen) selectClosedAtRef.current = Date.now();
          }}
        >
          <SelectTrigger className="w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TRANSACTION_TYPE_ALL}>All types</SelectItem>
            {TRANSACTION_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {capitalize(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {transactionsQuery.isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-destructive text-center">
                      Failed to load transactions.
                    </TableCell>
                  </TableRow>
                ) : !transactionsQuery.data || transactionsQuery.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionsQuery.data.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{capitalize(tx.type)}</TableCell>
                      <TableCell>{tx.quantity}</TableCell>
                      <TableCell>
                        {tx.importUnitCost ?? tx.soldUnitPrice ?? "—"}
                      </TableCell>
                      <TableCell>{tx.supplierName ?? "—"}</TableCell>
                      <TableCell>{tx.actor?.fullName ?? "—"}</TableCell>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleString("en-GB")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
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
