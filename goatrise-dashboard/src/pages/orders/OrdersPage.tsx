import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useOrders, useUpdateOrder } from "@/api/order/query-hooks.ts";
import type {
  Order,
  OrderChannel,
  OrderPaymentStatus,
  OrderStatus,
  UpdateOrderRequest,
} from "@/api/order/api.ts";
import type { Address } from "@/core/types.ts";
import { COUNTRIES } from "@/constant/countries.ts";
import { capitalize, formatPriceVn } from "@/core/utils.ts";
import { cn } from "@/lib/utils";
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

const PAGE_SIZE = 20;
const CHANNEL_ALL = "ALL";
const STATUS_ALL = "ALL";

const CHANNEL_OPTIONS: { label: string; value: OrderChannel }[] = [
  { label: "Website", value: "WEBSITE" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "TikTok", value: "TIKTOK" },
  { label: "Shopee", value: "SHOPEE" },
  { label: "Other", value: "OTHER" },
];

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipping", value: "SHIPPING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PAYMENT_STATUS_OPTIONS: { label: string; value: OrderPaymentStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Total (high→low)", value: "totalAmount:DESC" },
  { label: "Total (low→high)", value: "totalAmount:ASC" },
];

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPING: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAYMENT_STATUS_CLASS: Record<OrderPaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-muted text-muted-foreground",
};

export default function OrdersPage() {
  // ----- query states (mirror backend /api/orders filters) -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<OrderChannel | typeof CHANNEL_ALL>(CHANNEL_ALL);
  const [status, setStatus] = useState<OrderStatus | typeof STATUS_ALL>(STATUS_ALL);
  const [sort, setSort] = useState<string>("createdAt:DESC");
  const [offset, setOffset] = useState(0);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const navigate = useNavigate();

  // chỉ search khi nhấn Enter, không gọi request mỗi lần gõ
  function commitSearch() {
    setSearch(searchInput.trim());
    setOffset(0);
  }

  const params = useMemo(
    () => ({
      search: search || undefined,
      channel: channel === CHANNEL_ALL ? undefined : channel,
      status: status === STATUS_ALL ? undefined : status,
      sort,
      offset,
      limit: PAGE_SIZE,
    }),
    [search, channel, status, sort, offset],
  );

  const ordersQuery = useOrders(params);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const hasPrevious = offset > 0;
  const hasNext = (ordersQuery.data?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      {/* ----- header ----- */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">Orders</h1>
        <Button onClick={() => navigate("/orders/create")}>
          <Plus className="size-4" />
          New Order
        </Button>
      </div>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search code, name, phone or email..."
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
          value={channel}
          onValueChange={(value) => {
            setChannel(value as OrderChannel | typeof CHANNEL_ALL);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CHANNEL_ALL}>All channels</SelectItem>
            {CHANNEL_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as OrderStatus | typeof STATUS_ALL);
            setOffset(0);
          }}
        >
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
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
      </div>

      {/* ----- table ----- */}
      {ordersQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-destructive text-center">
                    Failed to load orders.
                  </TableCell>
                </TableRow>
              ) : !ordersQuery.data || ordersQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                ordersQuery.data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.code}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="text-muted-foreground text-xs">
                          {order.customerEmail || "None"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {order.customerPhoneNum || "None"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="block max-w-56 truncate text-xs"
                        title={formatAddress(order.customerAddress)}
                      >
                        {formatAddress(order.customerAddress)}
                      </span>
                    </TableCell>
                    <TableCell>{formatPriceVn(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge
                        label={capitalize(order.status)}
                        className={ORDER_STATUS_CLASS[order.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        label={capitalize(order.paymentStatus)}
                        className={PAYMENT_STATUS_CLASS[order.paymentStatus]}
                      />
                    </TableCell>
                    <TableCell>{capitalize(order.channel)}</TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleString("en-GB")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Update order"
                        title="Update order"
                        onClick={() => setEditingOrder(order)}
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

      {/* ----- pagination ----- */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          Page {page}
          {ordersQuery.isFetching ? " · updating..." : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevious || ordersQuery.isFetching}
            onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || ordersQuery.isFetching}
            onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </div>

      <UpdateOrderDialog
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSuccess={() => ordersQuery.refetch()}
      />
    </div>
  );
}

function UpdateOrderDialog({
  order,
  onClose,
  onSuccess,
}: {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const updateMutation = useUpdateOrder();
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatus>("PENDING");
  const [note, setNote] = useState("");
  // select portal ra ngoài dialog -> click đóng dropdown bị Dialog hiểu nhầm là click ngoài
  const selectOpenRef = useRef(false);
  const selectClosedAtRef = useRef(0);

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
      setNote(order.note ?? "");
    }
  }, [order]);

  // mirror rule backend
  const isLocked = order?.status === "COMPLETED";
  const completingWithoutPaid = status === "COMPLETED" && paymentStatus !== "PAID";
  const canSubmit = order !== null && !isLocked && !completingWithoutPaid;

  function handleSubmit() {
    if (!order) return;
    const request: UpdateOrderRequest = {
      status: status,
      paymentStatus: paymentStatus,
      note: note.trim() || undefined,
    };
    updateMutation.mutate(
      { orderId: order.id, request },
      {
        onSuccess: () => {
          toast.success(`Updated order ${order.code}`);
          onSuccess();
          onClose();
        },
        onError: (error) =>
          toast.error(
            isAxiosError(error) && typeof error.response?.data === "string"
              ? error.response.data
              : "Failed to update order",
          ),
      },
    );
  }

  return (
    <Dialog
      open={order !== null}
      onOpenChange={(next) => {
        if (next) return;
        if (selectOpenRef.current || Date.now() - selectClosedAtRef.current < 300) return;
        onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update order {order?.code}</DialogTitle>
        </DialogHeader>

        {isLocked ? (
          <p className="text-muted-foreground text-sm">
            This order is completed and can no longer be changed.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as OrderStatus)}
                  onOpenChange={(open) => {
                    selectOpenRef.current = open;
                    if (!open) selectClosedAtRef.current = Date.now();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel>Payment</FieldLabel>
                <Select
                  value={paymentStatus}
                  onValueChange={(v) => setPaymentStatus(v as OrderPaymentStatus)}
                  onOpenChange={(open) => {
                    selectOpenRef.current = open;
                    if (!open) selectClosedAtRef.current = Date.now();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {completingWithoutPaid && (
              <span className="text-destructive text-xs">
                Payment must be Paid to complete the order.
              </span>
            )}

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Note</FieldLabel>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            {isLocked ? "Close" : "Cancel"}
          </Button>
          {!isLocked && (
            <Button disabled={updateMutation.isPending || !canSubmit} onClick={handleSubmit}>
              {updateMutation.isPending && <Spinner />}
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="text-xs font-medium">{children}</label>;
}

function formatAddress(address: Address): string {
  const country =
    COUNTRIES[address.countryCode as keyof typeof COUNTRIES]?.viName ?? address.countryCode;
  return [address.address, address.provinceName, country].filter(Boolean).join(", ");
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}
