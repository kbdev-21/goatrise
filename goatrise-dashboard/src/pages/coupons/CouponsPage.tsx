import { useEffect, useMemo, useRef, useState } from "react";
import { Dices, Eye, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCoupons, useCreateCoupon } from "@/api/coupon/query-hooks.ts";
import type { Coupon, CouponDiscountType, CreateCouponRequest } from "@/api/coupon/api.ts";
import { formatPriceVn } from "@/core/utils.ts";
import { cn } from "@/lib/utils";
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

const PAGE_SIZE = 20;
const USE_ALL = "ALL";
const USE_IN = "IN_USE";
const USE_OUT = "OUT_OF_USE";
type UseFilter = typeof USE_ALL | typeof USE_IN | typeof USE_OUT;

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Code (A→Z)", value: "code:ASC" },
  { label: "Code (Z→A)", value: "code:DESC" },
];

const DISCOUNT_TYPE_OPTIONS: { label: string; value: CouponDiscountType }[] = [
  { label: "Fixed amount", value: "FIXED" },
  { label: "Percentage", value: "PERCENTAGE" },
];

export default function CouponsPage() {
  // ----- query states (mirror backend /api/coupons filters) -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [use, setUse] = useState<UseFilter>(USE_ALL);
  const [sort, setSort] = useState<string>("createdAt:DESC");
  const [offset, setOffset] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // chỉ search khi nhấn Enter, không gọi request mỗi lần gõ
  function commitSearch() {
    setSearch(searchInput.trim());
    setOffset(0);
  }

  const params = useMemo(
    () => ({
      search: search || undefined,
      isOutOfUse: use === USE_ALL ? undefined : use === USE_OUT,
      sort,
      offset,
      limit: PAGE_SIZE,
    }),
    [search, use, sort, offset],
  );

  const couponsQuery = useCoupons(params);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const hasPrevious = offset > 0;
  const hasNext = (couponsQuery.data?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Coupons</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search ID or code..."
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
          value={use}
          onValueChange={(value) => {
            setUse(value as UseFilter);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Usage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={USE_ALL}>All</SelectItem>
            <SelectItem value={USE_IN}>In use</SelectItem>
            <SelectItem value={USE_OUT}>Out of use</SelectItem>
          </SelectContent>
        </Select>

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

        <Button
          type="button"
          className="ml-auto"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="size-4" />
          New Coupon
        </Button>
      </div>

      {/* ----- table ----- */}
      {couponsQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min order</TableHead>
                <TableHead>Max discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couponsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-destructive text-center">
                    Failed to load coupons.
                  </TableCell>
                </TableRow>
              ) : !couponsQuery.data || couponsQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-center">
                    No coupons found.
                  </TableCell>
                </TableRow>
              ) : (
                couponsQuery.data.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono text-xs">{coupon.code}</TableCell>
                    <TableCell className="font-medium">{formatDiscount(coupon)}</TableCell>
                    <TableCell>
                      {coupon.minAppliablePrice > 0
                        ? formatPriceVn(coupon.minAppliablePrice)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {coupon.maxDiscountAmount !== null
                        ? formatPriceVn(coupon.maxDiscountAmount)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {coupon.usedCount} / {coupon.maximalUsage}
                    </TableCell>
                    <TableCell>
                      <StatusBadge coupon={coupon} />
                    </TableCell>
                    <TableCell>
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString("en-GB")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View details"
                        title="View details"
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
          {couponsQuery.isFetching ? " · updating..." : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevious || couponsQuery.isFetching}
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || couponsQuery.isFetching}
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      <CreateCouponDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => couponsQuery.refetch()}
      />
    </div>
  );
}

function formatDiscount(coupon: Coupon): string {
  return coupon.discountType === "PERCENTAGE"
    ? `${coupon.discountValue}%`
    : formatPriceVn(coupon.discountValue);
}

function StatusBadge({ coupon }: { coupon: Coupon }) {
  if (coupon.isOutOfUse) {
    return <Badge label="Out of use" className="bg-red-100 text-red-700" />;
  }
  if (!coupon.isActive) {
    return <Badge label="Inactive" className="bg-muted text-muted-foreground" />;
  }
  return <Badge label="Active" className="bg-green-100 text-green-700" />;
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", className)}
    >
      {label}
    </span>
  );
}

type CouponFormState = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minAppliablePrice: string;
  maxDiscountAmount: string;
  maximalUsage: string;
  startsAt: string;
  expiresAt: string;
};

const EMPTY_FORM_STATE: CouponFormState = {
  code: "",
  discountType: "FIXED",
  discountValue: "",
  minAppliablePrice: "",
  maxDiscountAmount: "",
  maximalUsage: "",
  startsAt: "",
  expiresAt: "",
};

function CreateCouponDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const createMutation = useCreateCoupon();
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM_STATE);
  // select content portal ra ngoài dialog -> click đóng dropdown bị Dialog hiểu
  // nhầm là click ngoài. Bỏ qua close oan bằng cách track select đang mở / vừa đóng.
  const selectOpenRef = useRef(false);
  const selectClosedAtRef = useRef(0);

  const set = (patch: Partial<CouponFormState>) => setForm((prev) => ({ ...prev, ...patch }));

  // reset form mỗi khi mở lại dialog
  useEffect(() => {
    if (open) setForm(EMPTY_FORM_STATE);
  }, [open]);

  const isPercentage = form.discountType === "PERCENTAGE";
  const discountValueNum = Number(form.discountValue);
  const canSubmit =
    form.code.trim().length > 0 &&
    form.discountValue.trim().length > 0 &&
    Number.isFinite(discountValueNum) &&
    discountValueNum > 0;

  function handleSubmit() {
    const request: CreateCouponRequest = {
      code: form.code.trim(),
      discountType: form.discountType,
      discountValue: discountValueNum,
      minAppliablePrice: form.minAppliablePrice ? Number(form.minAppliablePrice) : undefined,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      maximalUsage: form.maximalUsage ? Number(form.maximalUsage) : undefined,
      startsAt: form.startsAt || undefined,
      expiresAt: form.expiresAt || undefined,
    };
    createMutation.mutate(request, {
      onSuccess: (created) => {
        toast.success(`Created coupon ${created.code}`);
        onSuccess();
        onClose();
      },
      onError: (error) => {
        toast.error(
          isAxiosError(error) ? error.response?.data || error.message : "Failed to create coupon",
        );
      },
    });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New coupon</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <FieldLabel required>Code</FieldLabel>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="e.g. SUMMER10"
                value={form.code}
                onChange={(e) => set({ code: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Randomize"
                aria-label="Randomize"
                onClick={() => set({ code: form.code + "_" + randomCode(6) })}
              >
                <Dices className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel required>Discount type</FieldLabel>
              <Select
                value={form.discountType}
                onValueChange={(value) => set({ discountType: value as CouponDiscountType })}
                onOpenChange={(selectOpen) => {
                  selectOpenRef.current = selectOpen;
                  if (!selectOpen) selectClosedAtRef.current = Date.now();
                }}
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

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Min order</FieldLabel>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 200000"
                value={form.minAppliablePrice}
                onChange={(e) => set({ minAppliablePrice: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Max discount</FieldLabel>
              <Input
                type="number"
                min={1}
                placeholder="cap for %"
                value={form.maxDiscountAmount}
                onChange={(e) => set({ maxDiscountAmount: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Max usage</FieldLabel>
            <Input
              type="number"
              min={1}
              placeholder="default 1"
              value={form.maximalUsage}
              onChange={(e) => set({ maximalUsage: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Starts at</FieldLabel>
              <Input
                type="date"
                value={form.startsAt}
                onChange={(e) => set({ startsAt: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Expires at</FieldLabel>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => set({ expiresAt: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button disabled={createMutation.isPending || !canSubmit} onClick={handleSubmit}>
            {createMutation.isPending && <Spinner />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function randomCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
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
