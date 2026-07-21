import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  useCombos,
  useCreateCombo,
  useDeleteCombo,
  useUpdateCombo,
} from "@/api/combo/query-hooks.ts";
import type {
  Combo,
  ComboCondition,
  ComboConditionTargetType,
  ComboDiscountType,
  CreateComboRequest,
} from "@/api/combo/api.ts";
import { useItems } from "@/api/item/query-hooks.ts";
import { useProducts } from "@/api/product/query-hooks.ts";
import { useCollections } from "@/api/collection/query-hooks.ts";
import { formatPriceVn, normalizeVietnameseString } from "@/core/utils.ts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Switch } from "@/components/ui/switch.tsx";
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
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox.tsx";

const DISCOUNT_TYPE_OPTIONS: { label: string; value: ComboDiscountType }[] = [
  { label: "Fixed amount", value: "FIXED" },
  { label: "Percentage", value: "PERCENTAGE" },
];

const TARGET_TYPE_OPTIONS: { label: string; value: ComboConditionTargetType }[] = [
  { label: "Item", value: "ITEM" },
  { label: "Product", value: "PRODUCT" },
  { label: "Collection", value: "COLLECTION" },
];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Code (A→Z)", value: "code:ASC" },
  { label: "Code (Z→A)", value: "code:DESC" },
];

export default function CombosPage() {
  // fetch toàn bộ 1 lần rồi search/sort phía client
  const combosQuery = useCombos();
  // undefined = dialog đóng; null = create; Combo = update
  const [editing, setEditing] = useState<Combo | null | undefined>(undefined);

  // ----- client-side query state -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("createdAt:DESC");

  function commitSearch() {
    setSearch(searchInput.trim());
  }

  const filteredCombos = useMemo(() => {
    const combos = combosQuery.data ?? [];
    const keyword = normalizeVietnameseString(search);
    if (!keyword) return combos;
    return combos.filter((combo) =>
      normalizeVietnameseString(combo.code).includes(keyword),
    );
  }, [combosQuery.data, search]);

  const sortedCombos = useMemo(() => {
    const [field, direction] = sort.split(":");
    const factor = direction === "ASC" ? 1 : -1;
    return [...filteredCombos].sort((a, b) => {
      let cmp: number;
      switch (field) {
        case "code":
          cmp = a.code.localeCompare(b.code);
          break;
        default:
          cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return cmp * factor;
    });
  }, [filteredCombos, sort]);

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Combos</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search code..."
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

        <Button type="button" className="ml-auto" onClick={() => setEditing(null)}>
          <Plus className="size-4" />
          New Combo
        </Button>
      </div>

      {/* ----- table ----- */}
      {combosQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Conditions</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combosQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-destructive text-center">
                    Failed to load combos.
                  </TableCell>
                </TableRow>
              ) : sortedCombos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
                    No combos found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedCombos.map((combo) => (
                  <TableRow key={combo.id}>
                    <TableCell className="font-mono text-xs">{combo.code}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground block max-w-96 truncate text-xs">
                        {combo.description || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {combo.andConditions.length}{" "}
                      {combo.andConditions.length === 1 ? "condition" : "conditions"}
                    </TableCell>
                    <TableCell className="font-medium">{formatDiscount(combo)}</TableCell>
                    <TableCell>{combo.usedCount}</TableCell>
                    <TableCell>
                      {combo.isActive ? (
                        <Badge label="Active" className="bg-green-100 text-green-700" />
                      ) : (
                        <Badge label="Inactive" className="bg-muted text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit combo"
                        title="Edit combo"
                        onClick={() => setEditing(combo)}
                      >
                        <Pencil className="size-4" />
                      </Button>
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
        {filteredCombos.length} combo{filteredCombos.length === 1 ? "" : "s"}
        {combosQuery.isFetching ? " · updating..." : ""}
      </span>

      <ComboFormDialog
        open={editing !== undefined}
        combo={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSuccess={() => combosQuery.refetch()}
      />
    </div>
  );
}

function formatDiscount(combo: Combo): string {
  return combo.discountType === "PERCENTAGE"
    ? `${combo.discountValue}%`
    : formatPriceVn(combo.discountValue);
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

type ComboFormState = {
  code: string;
  description: string;
  discountType: ComboDiscountType;
  discountValue: string;
  isActive: boolean;
  conditions: ComboCondition[];
};

const EMPTY_CONDITION: ComboCondition = { targetType: "ITEM", targetId: "", quantity: 1 };

const EMPTY_FORM_STATE: ComboFormState = {
  code: "",
  description: "",
  discountType: "FIXED",
  discountValue: "",
  isActive: true,
  conditions: [EMPTY_CONDITION],
};

function ComboFormDialog({
  open,
  combo,
  onClose,
  onSuccess,
}: {
  open: boolean;
  combo: Combo | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = combo !== null;
  const createMutation = useCreateCombo();
  const updateMutation = useUpdateCombo();
  const deleteMutation = useDeleteCombo();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<ComboFormState>(EMPTY_FORM_STATE);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  // portal target-combobox VÀO trong dialog content: Radix Dialog (modal) tắt pointer-events
  // ngoài content, nên popup base-ui portal ra body sẽ không click chọn được.
  const contentRef = useRef<HTMLDivElement>(null);

  // select/combobox content portal ra ngoài dialog -> click chọn bị Dialog hiểu nhầm là
  // click ngoài. Bỏ qua close oan bằng cách track portal đang mở / vừa đóng.
  const portalOpenRef = useRef(false);
  const portalClosedAtRef = useRef(0);
  const guardPortalOpen = (portalOpen: boolean) => {
    portalOpenRef.current = portalOpen;
    if (!portalOpen) portalClosedAtRef.current = Date.now();
  };

  // options cho target picker, tách theo từng loại target
  const itemsQuery = useItems();
  const productsQuery = useProducts();
  const collectionsQuery = useCollections();
  const optionsByType = useMemo<Record<ComboConditionTargetType, TargetOption[]>>(() => {
    const items = itemsQuery.data ?? [];
    const products = productsQuery.data ?? [];
    const collections = collectionsQuery.data ?? [];
    return {
      ITEM: items.map((item) => ({ id: item.id, label: `${item.name} · ${item.sku}` })),
      PRODUCT: products.map((product) => ({ id: product.id, label: product.title.vi })),
      COLLECTION: collections.map((collection) => ({ id: collection.id, label: collection.title.vi })),
    };
  }, [itemsQuery.data, productsQuery.data, collectionsQuery.data]);

  // nạp form mỗi khi mở lại dialog (theo combo đang edit, hoặc rỗng khi create)
  useEffect(() => {
    if (!open) return;
    setConfirmDeleteOpen(false);
    if (combo) {
      setForm({
        code: combo.code,
        description: combo.description ?? "",
        discountType: combo.discountType,
        discountValue: String(combo.discountValue),
        isActive: combo.isActive,
        conditions: combo.andConditions.map((cond) => ({ ...cond })),
      });
    } else {
      setForm({ ...EMPTY_FORM_STATE, conditions: [{ ...EMPTY_CONDITION }] });
    }
  }, [open, combo]);

  const set = (patch: Partial<ComboFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const addCondition = () =>
    set({ conditions: [...form.conditions, { ...EMPTY_CONDITION }] });
  const removeCondition = (index: number) =>
    set({ conditions: form.conditions.filter((_, i) => i !== index) });
  const updateCondition = (index: number, patch: Partial<ComboCondition>) =>
    set({
      conditions: form.conditions.map((cond, i) => (i === index ? { ...cond, ...patch } : cond)),
    });

  const isPercentage = form.discountType === "PERCENTAGE";
  const discountValueNum = Number(form.discountValue);
  const canSubmit =
    form.code.trim().length > 0 &&
    form.discountValue.trim().length > 0 &&
    Number.isFinite(discountValueNum) &&
    discountValueNum > 0 &&
    form.conditions.length > 0 &&
    form.conditions.every((cond) => cond.targetId.length > 0 && cond.quantity > 0);

  function handleSubmit() {
    const request: CreateComboRequest = {
      code: form.code.trim(),
      description: form.description.trim() || null,
      andConditions: form.conditions.map((cond) => ({
        targetType: cond.targetType,
        targetId: cond.targetId,
        quantity: cond.quantity,
      })),
      discountType: form.discountType,
      discountValue: discountValueNum,
      isActive: form.isActive,
    };

    const onDone = (saved: Combo) => {
      toast.success(`${isEdit ? "Updated" : "Created"} combo ${saved.code}`);
      onSuccess();
      onClose();
    };
    const onFail = (error: unknown) => {
      toast.error(
        isAxiosError(error)
          ? error.response?.data || error.message
          : `Failed to ${isEdit ? "update" : "create"} combo`,
      );
    };

    if (isEdit && combo) {
      updateMutation.mutate({ comboId: combo.id, request }, { onSuccess: onDone, onError: onFail });
    } else {
      createMutation.mutate(request, { onSuccess: onDone, onError: onFail });
    }
  }

  function handleDelete() {
    if (!combo) return;
    deleteMutation.mutate(combo.id, {
      onSuccess: () => {
        toast.success(`Deleted combo ${combo.code}`);
        setConfirmDeleteOpen(false);
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(
          isAxiosError(error)
            ? error.response?.data || error.message
            : "Failed to delete combo",
        );
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        // đừng đóng form khi đang tương tác portal, hoặc khi confirm-delete đang mở
        if (confirmDeleteOpen || portalOpenRef.current || Date.now() - portalClosedAtRef.current < 300) {
          return;
        }
        onClose();
      }}
    >
      <DialogContent ref={contentRef} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit combo" : "New combo"}</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          {/* code */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Code</FieldLabel>
            <Input
              placeholder="e.g. SUMMER_COMBO"
              value={form.code}
              onChange={(e) => set({ code: e.target.value })}
            />
          </div>

          {/* description */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              placeholder="Short description..."
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>

          {/* discount */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Discount type</FieldLabel>
              <Select
                value={form.discountType}
                onValueChange={(value) => set({ discountType: value as ComboDiscountType })}
                onOpenChange={guardPortalOpen}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>{isPercentage ? "Percentage (%)" : "Amount (đ)"}</FieldLabel>
              <Input
                type="number"
                min={1}
                placeholder={isPercentage ? "e.g. 10" : "e.g. 50000"}
                value={form.discountValue}
                onChange={(e) => set({ discountValue: e.target.value })}
              />
            </div>
          </div>

          {/* active */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium">Active</span>
              <span className="text-muted-foreground text-xs">
                Inactive combos are never applied to orders.
              </span>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => set({ isActive: v })} />
          </div>

          {/* conditions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <FieldLabel required>Conditions (all must match)</FieldLabel>
              <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            {form.conditions.length === 0 ? (
              <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
                Add at least one condition.
              </div>
            ) : (
              form.conditions.map((condition, index) => (
                <ConditionCard
                  key={index}
                  index={index}
                  condition={condition}
                  options={optionsByType[condition.targetType]}
                  onChange={(patch) => updateCondition(index, patch)}
                  onRemove={() => removeCondition(index)}
                  onPortalOpenChange={guardPortalOpen}
                  portalContainer={contentRef}
                />
              ))
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {isEdit ? (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isPending || deleteMutation.isPending}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
              {isPending && <Spinner />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {isEdit && (
        <ConfirmDeleteDialog
          open={confirmDeleteOpen}
          comboName={combo?.code ?? ""}
          isPending={deleteMutation.isPending}
          onCancel={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </Dialog>
  );
}

type TargetOption = { id: string; label: string };

function ConditionCard({
  index,
  condition,
  options,
  onChange,
  onRemove,
  onPortalOpenChange,
  portalContainer,
}: {
  index: number;
  condition: ComboCondition;
  options: TargetOption[];
  onChange: (patch: Partial<ComboCondition>) => void;
  onRemove: () => void;
  onPortalOpenChange: (open: boolean) => void;
  portalContainer: RefObject<HTMLDivElement | null>;
}) {
  const labelById = useMemo(
    () => new Map(options.map((opt) => [opt.id, opt.label])),
    [options],
  );
  const ids = options.map((opt) => opt.id);

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">Condition {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remove condition"
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Target type</FieldLabel>
          <Select
            value={condition.targetType}
            // đổi loại target thì reset targetId đã chọn (khác danh sách)
            onValueChange={(value) =>
              onChange({ targetType: value as ComboConditionTargetType, targetId: "" })
            }
            onOpenChange={onPortalOpenChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGET_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel>Quantity</FieldLabel>
          <Input
            type="number"
            min={1}
            value={condition.quantity}
            onChange={(e) => onChange({ quantity: Math.max(1, Number(e.target.value)) })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Target</FieldLabel>
        <Combobox
          items={ids}
          value={condition.targetId || null}
          onValueChange={(next) => onChange({ targetId: typeof next === "string" ? next : "" })}
          onOpenChange={onPortalOpenChange}
          itemToStringLabel={(id) => labelById.get(id as string) ?? ""}
        >
          <ComboboxInput placeholder="Search target..." />
          <ComboboxContent container={portalContainer}>
            <ComboboxEmpty>No result found.</ComboboxEmpty>
            <ComboboxList>
              <ComboboxCollection>
                {(id: string) => (
                  <ComboboxItem key={id} value={id}>
                    {labelById.get(id) ?? id}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  open,
  comboName,
  isPending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  comboName: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete combo</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          Are you sure you want to delete <span className="text-foreground font-medium">{comboName}</span>?
          This action cannot be undone.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
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
