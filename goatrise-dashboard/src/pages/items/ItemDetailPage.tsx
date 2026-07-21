import { useEffect, useRef, useState } from "react";
import { ArrowLeft, PackagePlus, RefreshCcw, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  useAdjustItemStock,
  useDeleteItem,
  useImportItem,
  useItem,
  useItemTransactions,
  useUpdateItem,
} from "@/api/item/query-hooks.ts";
import type {
  AdjustItemStockRequest,
  ImportItemRequest,
  Item,
  ItemAttributeValues,
  ItemTransaction,
  ItemTransactionType,
  UpdateItemRequest,
} from "@/api/item/api.ts";
import { useSuppliers } from "@/api/supplier/query-hooks.ts";
import { useProducts } from "@/api/product/query-hooks.ts";
import { capitalize, formatPriceVn } from "@/core/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import ItemInfoForm, { type ItemInfoFormValue } from "./ItemInfoForm.tsx";

const TRANSACTION_TYPE_ALL = "ALL";
const TRANSACTION_TYPE_OPTIONS: ItemTransactionType[] = ["IMPORT", "ADJUST", "SOLD"];
const TRANSACTION_PAGE_SIZE = 10;

const SUPPLIER_NONE = "NONE";

export default function ItemDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const itemQuery = useItem(id ?? "");
  const updateItemMutation = useUpdateItem();
  const productsQuery = useProducts();

  const [value, setValue] = useState<ItemInfoFormValue | null>(null);
  const [txType, setTxType] = useState<ItemTransactionType | typeof TRANSACTION_TYPE_ALL>(
    TRANSACTION_TYPE_ALL,
  );
  const [txOffset, setTxOffset] = useState(0);
  const [selectedTx, setSelectedTx] = useState<ItemTransaction | null>(null);
  const [importingItem, setImportingItem] = useState<Item | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const transactionsQuery = useItemTransactions(id ?? "", {
    type: txType === TRANSACTION_TYPE_ALL ? undefined : txType,
    offset: txOffset,
    limit: TRANSACTION_PAGE_SIZE,
  });

  const txPage = Math.floor(txOffset / TRANSACTION_PAGE_SIZE) + 1;
  const txHasPrevious = txOffset > 0;
  const txHasNext = (transactionsQuery.data?.length ?? 0) === TRANSACTION_PAGE_SIZE;

  // seed form từ item khi load xong
  useEffect(() => {
    if (itemQuery.data) {
      setValue(itemToFormValue(itemQuery.data));
    }
  }, [itemQuery.data]);

  const isDirty =
    !!value &&
    !!itemQuery.data &&
    JSON.stringify(value) !== JSON.stringify(itemToFormValue(itemQuery.data));

  const canSave =
    !!value &&
    value.sku.trim().length > 0 &&
    value.name.trim().length > 0 &&
    value.price.trim().length > 0 &&
    isDirty;

  function handleSave() {
    if (!id || !value) return;

    const attributeValues: ItemAttributeValues = {};
    if (value.colorEnabled) {
      attributeValues.COLOR = {
        hex: value.colorHex.trim(),
        enText: value.colorEnText.trim(),
        viText: value.colorViText.trim(),
      };
    }
    if (value.sizeEnabled) {
      attributeValues.SIZE = value.size.trim();
    }

    const request: UpdateItemRequest = {
      sku: value.sku.trim(),
      name: value.name.trim(),
      price: Number(value.price),
      note: value.note.trim() || undefined,
      imgUrl: value.imgUrl.trim() || undefined,
      weight: value.weight ? Number(value.weight) : undefined,
      productId: value.productId ?? undefined,
      isActive: value.isActive,
      attributeValues:
        Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
    };

    updateItemMutation.mutate(
      { itemId: id, request },
      {
        onSuccess: (item) => {
          toast.success(`Updated item ${item.name}`);
          navigate("/items");
        },
        onError: (error) => {
          toast.error(
            isAxiosError(error) && typeof error.response?.data === "string"
              ? error.response.data
              : "Failed to update item",
          );
        },
      },
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back"
          onClick={() => navigate("/items")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-medium">Item Detail</h1>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="ml-auto">
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              disabled={!itemQuery.data}
              onClick={() => itemQuery.data && setDeletingItem(itemQuery.data)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          disabled={!canSave || updateItemMutation.isPending}
          onClick={handleSave}
        >
          {updateItemMutation.isPending ? (
            <Spinner />
          ) : (
            <Save className="size-4" />
          )}
          Save
        </Button>
      </div>

      <div className="flex gap-4">
        {/* trái: form, chiếm phần lớn diện tích */}
        <div className="flex-1">
          {itemQuery.isError ? (
            <div className="bg-card text-destructive rounded-md border p-6 text-sm">
              Failed to load item.
            </div>
          ) : !value ? (
            <div className="bg-card flex items-center justify-center rounded-md border p-6">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : (
            <ItemInfoForm value={value} onChange={setValue} products={productsQuery.data ?? []} />
          )}
        </div>

        {/* phải: 2 card rời - Data + Transactions */}
        <div className="flex w-[30rem] shrink-0 flex-col gap-4">
          {/* card Data */}
          <div className="bg-card flex flex-col gap-4 rounded-md border p-6">
            <h2 className="text-base font-medium">Data</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Stock</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="flex-1"
                    value={itemQuery.data?.stock ?? ""}
                    readOnly
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Import"
                    title="Import"
                    disabled={!itemQuery.data}
                    onClick={() => itemQuery.data && setImportingItem(itemQuery.data)}
                  >
                    <PackagePlus className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Adjust stock"
                    title="Adjust stock"
                    disabled={!itemQuery.data}
                    onClick={() => itemQuery.data && setAdjustingItem(itemQuery.data)}
                  >
                    <RefreshCcw className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium">Sold</label>
                <Input
                  type="number"
                  value={itemQuery.data?.sold ?? ""}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* card Transactions */}
          <div className="bg-card flex flex-col gap-2 rounded-md border p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Transactions</span>
              <Select
                value={txType}
                onValueChange={(value) => {
                  setTxType(value as ItemTransactionType | typeof TRANSACTION_TYPE_ALL);
                  setTxOffset(0);
                }}
              >
                <SelectTrigger className="w-36">
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
            </div>

            {transactionsQuery.isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Spinner className="text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-96 overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit price</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsQuery.isError ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-destructive text-center">
                          Failed to load transactions.
                        </TableCell>
                      </TableRow>
                    ) : !transactionsQuery.data || transactionsQuery.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactionsQuery.data.map((tx) => (
                        <TableRow
                          key={tx.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <TableCell>{capitalize(tx.type)}</TableCell>
                          <TableCell>{tx.quantity}</TableCell>
                          <TableCell>
                            {formatPriceVn(tx.importUnitCost ?? tx.soldUnitPrice)}
                          </TableCell>
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

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Page {txPage}
                {transactionsQuery.isFetching ? " · updating..." : ""}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!txHasPrevious || transactionsQuery.isFetching}
                  onClick={() =>
                    setTxOffset((prev) => Math.max(0, prev - TRANSACTION_PAGE_SIZE))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!txHasNext || transactionsQuery.isFetching}
                  onClick={() => setTxOffset((prev) => prev + TRANSACTION_PAGE_SIZE)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ItemTransactionDetailDialog
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />

      <DeleteItemDialog
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
      />

      <ImportItemDialog
        item={importingItem}
        onClose={() => setImportingItem(null)}
        onSuccess={() => {}}
      />

      <AdjustItemDialog
        item={adjustingItem}
        onClose={() => setAdjustingItem(null)}
        onSuccess={() => {}}
      />
    </div>
  );
}

function itemToFormValue(item: Item): ItemInfoFormValue {
  return {
    sku: item.sku,
    name: item.name,
    productId: item.productId,
    price: String(item.price),
    weight: item.weight !== null ? String(item.weight) : "",
    imgUrl: item.imgUrl ?? "",
    note: item.note ?? "",
    isActive: item.isActive,
    colorEnabled: !!item.attributeValues?.COLOR,
    colorHex: item.attributeValues?.COLOR?.hex ?? "",
    colorEnText: item.attributeValues?.COLOR?.enText ?? "",
    colorViText: item.attributeValues?.COLOR?.viText ?? "",
    sizeEnabled: item.attributeValues?.SIZE !== undefined,
    size: item.attributeValues?.SIZE ?? "",
  };
}

function ItemTransactionDetailDialog({
  transaction,
  onClose,
}: {
  transaction: ItemTransaction | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!transaction} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transaction Detail</DialogTitle>
        </DialogHeader>

        {transaction && (
          <div className="divide-border flex min-w-0 flex-col divide-y">
            <DetailRow label="Type" value={capitalize(transaction.type)} />
            <DetailRow label="Quantity" value={String(transaction.quantity)} />
            <DetailRow
              label="Import unit cost"
              value={formatPriceVn(transaction.importUnitCost)}
            />
            <DetailRow
              label="Sold unit price"
              value={formatPriceVn(transaction.soldUnitPrice)}
            />
            <DetailRow label="Supplier" value={transaction.supplierName ?? "—"} />
            <DetailRow label="By" value={transaction.actor?.fullName ?? "—"} />
            <DetailRow label="Note" value={transaction.note ?? "—"} />
            <DetailRow
              label="Date"
              value={new Date(transaction.createdAt).toLocaleString("en-GB")}
            />
            <DetailRow
              label="Item"
              value={`${transaction.itemName} (${transaction.itemSku})`}
            />
            <DetailRow label="ID" value={transaction.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteItemDialog({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const deleteItemMutation = useDeleteItem();

  return (
    <Dialog open={!!item} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete item</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-xs">
          This will permanently delete{" "}
          <span className="text-foreground font-medium">{item?.name}</span>. This
          action cannot be undone.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteItemMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteItemMutation.isPending}
            onClick={() => {
              if (!item) return;
              deleteItemMutation.mutate(item.id, {
                onSuccess: () => {
                  toast.success(`Deleted item ${item.name}`);
                  navigate("/items");
                },
                onError: (error) => {
                  toast.error(
                    isAxiosError(error) && typeof error.response?.data === "string"
                      ? error.response.data
                      : "Failed to delete item",
                  );
                },
              });
            }}
          >
            {deleteItemMutation.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="col-span-2 text-xs break-all">{value}</span>
    </div>
  );
}

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
                    toast.success(`Adjusted ${updated.name} to ${updated.stock}`);
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
