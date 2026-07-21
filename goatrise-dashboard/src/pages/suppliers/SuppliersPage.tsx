import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "@/api/supplier/query-hooks.ts";
import type { CreateSupplierRequest, Supplier } from "@/api/supplier/api.ts";
import { normalizeVietnameseString } from "@/core/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
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
  { label: "Name (A→Z)", value: "name:ASC" },
  { label: "Name (Z→A)", value: "name:DESC" },
];

export default function SuppliersPage() {
  // fetch toàn bộ 1 lần rồi search/sort phía client
  const suppliersQuery = useSuppliers();
  // undefined = dialog đóng; null = create; Supplier = detail
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // ----- client-side query state -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("createdAt:DESC");

  function commitSearch() {
    setSearch(searchInput.trim());
  }

  const filteredSuppliers = useMemo(() => {
    const suppliers = suppliersQuery.data ?? [];
    const keyword = normalizeVietnameseString(search);
    if (!keyword) return suppliers;
    return suppliers.filter((supplier) =>
      normalizeVietnameseString(`${supplier.name} ${supplier.note ?? ""}`).includes(keyword),
    );
  }, [suppliersQuery.data, search]);

  const sortedSuppliers = useMemo(() => {
    const [field, direction] = sort.split(":");
    const factor = direction === "ASC" ? 1 : -1;
    return [...filteredSuppliers].sort((a, b) => {
      let cmp: number;
      switch (field) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        default:
          cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return cmp * factor;
    });
  }, [filteredSuppliers, sort]);

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Suppliers</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search name or note..."
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
          New Supplier
        </Button>
      </div>

      {/* ----- table ----- */}
      {suppliersQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-destructive text-center">
                    Failed to load suppliers.
                  </TableCell>
                </TableRow>
              ) : sortedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => setEditing(supplier)}
                      >
                        {supplier.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground block max-w-96 truncate text-xs">
                        {supplier.note || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(supplier.createdAt).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit supplier"
                          title="Edit supplier"
                          onClick={() => setEditing(supplier)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete supplier"
                          title="Delete supplier"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeletingSupplier(supplier)}
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
        {filteredSuppliers.length} supplier{filteredSuppliers.length === 1 ? "" : "s"}
        {suppliersQuery.isFetching ? " · updating..." : ""}
      </span>

      <SupplierFormDialog
        open={editing !== undefined}
        supplier={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSuccess={() => suppliersQuery.refetch()}
      />

      <DeleteSupplierDialog
        supplier={deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        onSuccess={() => suppliersQuery.refetch()}
      />
    </div>
  );
}

function DeleteSupplierDialog({
  supplier,
  onClose,
  onSuccess,
}: {
  supplier: Supplier | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const deleteMutation = useDeleteSupplier();

  function handleDelete() {
    if (!supplier) return;
    deleteMutation.mutate(supplier.id, {
      onSuccess: () => {
        toast.success(`Deleted supplier ${supplier.name}`);
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(
          isAxiosError(error)
            ? error.response?.data || error.message
            : "Failed to delete supplier",
        );
      },
    });
  }

  return (
    <Dialog open={supplier !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete supplier</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          This will permanently delete{" "}
          <span className="text-foreground font-medium">{supplier?.name}</span>. This action
          cannot be undone.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Spinner />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SupplierFormDialog({
  open,
  supplier,
  onClose,
  onSuccess,
}: {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = supplier !== null;
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  // nạp form mỗi khi mở lại dialog (theo supplier đang xem, hoặc rỗng khi create)
  useEffect(() => {
    if (!open) return;
    setName(supplier?.name ?? "");
    setNote(supplier?.note ?? "");
  }, [open, supplier]);

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    const request: CreateSupplierRequest = {
      name: name.trim(),
      note: note.trim() || undefined,
    };

    const onDone = (saved: Supplier) => {
      toast.success(`${isEdit ? "Updated" : "Created"} supplier ${saved.name}`);
      onSuccess();
      onClose();
    };
    const onFail = (error: unknown) => {
      toast.error(
        isAxiosError(error)
          ? error.response?.data || error.message
          : `Failed to ${isEdit ? "update" : "create"} supplier`,
      );
    };

    if (isEdit && supplier) {
      updateMutation.mutate(
        { supplierId: supplier.id, request },
        { onSuccess: onDone, onError: onFail },
      );
    } else {
      createMutation.mutate(request, { onSuccess: onDone, onError: onFail });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Supplier detail" : "New supplier"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Name</FieldLabel>
            <Input
              placeholder="e.g. Xưởng may A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Note</FieldLabel>
            <Textarea
              placeholder="Internal note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {isEdit && supplier && (
            <div className="text-muted-foreground grid grid-cols-2 gap-3 border-t pt-3 text-xs">
              <span>Created: {new Date(supplier.createdAt).toLocaleString("en-GB")}</span>
              <span>Updated: {new Date(supplier.updatedAt).toLocaleString("en-GB")}</span>
            </div>
          )}
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
