import { useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCustomers, useUpdateCustomer } from "@/api/customer/query-hooks.ts";
import type { Customer, UpdateCustomerRequest } from "@/api/customer/api.ts";
import type { SalesChannel } from "@/core/types.ts";
import { formatPriceVn } from "@/core/utils.ts";
import { SalesChannelBadge } from "@/components/shared/sales-channel-badge.tsx";
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

const SOURCE_OPTIONS: { label: string; value: SalesChannel }[] = [
  { label: "Website", value: "WEBSITE" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "TikTok", value: "TIKTOK" },
  { label: "Shopee", value: "SHOPEE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Other", value: "OTHER" },
];

const PAGE_SIZE = 20;

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Most spent", value: "totalSpent:DESC" },
  { label: "Most orders", value: "totalOrders:DESC" },
  { label: "Recent order", value: "lastOrderAt:DESC" },
  { label: "Name (A→Z)", value: "name:ASC" },
];

export default function CustomersPage() {
  // ----- query states (mirror backend /api/customers filters) -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("createdAt:DESC");
  const [offset, setOffset] = useState(0);

  // null = dialog đóng; Customer = đang edit customer đó
  const [editing, setEditing] = useState<Customer | null>(null);

  // chỉ search khi nhấn Enter, không gọi request mỗi lần gõ
  function commitSearch() {
    setSearch(searchInput.trim());
    setOffset(0);
  }

  const params = useMemo(
    () => ({
      search: search || undefined,
      sort,
      offset,
      limit: PAGE_SIZE,
    }),
    [search, sort, offset],
  );

  const customersQuery = useCustomers(params);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const hasPrevious = offset > 0;
  const hasNext = (customersQuery.data?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Customers</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search name, email or phone..."
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
          value={sort}
          onValueChange={(value) => {
            setSort(value);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-44 bg-card">
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
      </div>

      {/* ----- table ----- */}
      {customersQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Loyalty</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-destructive text-center">
                    Failed to load customers.
                  </TableCell>
                </TableRow>
              ) : !customersQuery.data || customersQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customersQuery.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground text-xs">
                          {customer.email || "—"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {customer.phoneNum || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SalesChannelBadge channel={customer.source} />
                    </TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>{formatPriceVn(customer.totalSpent)}</TableCell>
                    <TableCell>{customer.loyaltyPoints}</TableCell>
                    <TableCell>
                      {customer.lastOrderAt
                        ? new Date(customer.lastOrderAt).toLocaleDateString("en-GB")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View customer detail"
                        title="View customer detail"
                        onClick={() => setEditing(customer)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ----- pagination ----- */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          Page {page}
          {customersQuery.isFetching ? " · updating..." : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevious || customersQuery.isFetching}
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || customersQuery.isFetching}
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      <CustomerEditDialog
        customer={editing}
        onClose={() => setEditing(null)}
        onSuccess={() => customersQuery.refetch()}
      />
    </div>
  );
}

function CustomerEditDialog({
  customer,
  onClose,
  onSuccess,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const updateMutation = useUpdateCustomer();
  const isPending = updateMutation.isPending;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [source, setSource] = useState<SalesChannel>("OTHER");
  const [note, setNote] = useState("");

  // nạp form mỗi khi mở lại dialog theo customer đang chọn
  useEffect(() => {
    if (!customer) return;
    setName(customer.name);
    setEmail(customer.email ?? "");
    setPhoneNum(customer.phoneNum ?? "");
    setSource(customer.source);
    setNote(customer.note ?? "");
  }, [customer]);

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!customer) return;

    // giữ nguyên socialMedias/addresses (không sửa ở dialog này) để không mất dữ liệu
    const request: UpdateCustomerRequest = {
      name: name.trim(),
      email: email.trim() || undefined,
      phoneNum: phoneNum.trim() || undefined,
      source: source,
      note: note.trim() || undefined,
      socialMedias: customer.socialMedias,
      addresses: customer.addresses,
    };

    updateMutation.mutate(
      { customerId: customer.id, request },
      {
        onSuccess: (saved) => {
          toast.success(`Updated customer ${saved.name}`);
          onSuccess();
          onClose();
        },
        onError: (error) => {
          toast.error(
            isAxiosError(error)
              ? error.response?.data || error.message
              : "Failed to update customer",
          );
        },
      },
    );
  }

  return (
    <Dialog open={customer !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customer detail</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Name</FieldLabel>
            <Input
              placeholder="e.g. Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="e.g. customer@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Phone</FieldLabel>
            <Input
              placeholder="e.g. 0901234567"
              value={phoneNum}
              onChange={(e) => setPhoneNum(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Source</FieldLabel>
            <Select value={source} onValueChange={(v) => setSource(v as SalesChannel)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Note</FieldLabel>
            <Textarea
              placeholder="Internal note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {customer && (
            <div className="text-muted-foreground grid grid-cols-2 gap-3 border-t pt-3 text-xs">
              <span>Loyalty: {customer.loyaltyPoints}</span>
              <span>Orders: {customer.totalOrders}</span>
              <span>Created: {new Date(customer.createdAt).toLocaleString("en-GB")}</span>
              <span>Updated: {new Date(customer.updatedAt).toLocaleString("en-GB")}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button disabled={isPending || !canSubmit} onClick={handleSubmit}>
            {isPending && <Spinner />}
            Save
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
