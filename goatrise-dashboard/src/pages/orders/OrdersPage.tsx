import { useMemo, useState } from "react";
import { Eye, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "@/api/order/query-hooks.ts";
import type { OrderPaymentStatus, OrderStatus } from "@/api/order/api.ts";
import type { Address, SalesChannel } from "@/core/types.ts";
import { COUNTRIES } from "@/constant/countries.ts";
import { capitalize, formatPriceVn } from "@/core/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Input } from "@/components/ui/input.tsx";
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
import { Badge } from "@/components/shared/badge.tsx";
import { SalesChannelBadge } from "@/components/shared/sales-channel-badge.tsx";

const PAGE_SIZE = 20;
const CHANNEL_ALL = "ALL";
const STATUS_ALL = "ALL";

const CHANNEL_OPTIONS: { label: string; value: SalesChannel }[] = [
  { label: "Website", value: "WEBSITE" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "TikTok", value: "TIKTOK" },
  { label: "Shopee", value: "SHOPEE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Other", value: "OTHER" },
];

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Shipping", value: "SHIPPING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
  { label: "Total (high→low)", value: "totalAmount:DESC" },
  { label: "Total (low→high)", value: "totalAmount:ASC" },
];

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SHIPPING: "bg-blue-100 text-blue-700",
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
  const [channel, setChannel] = useState<SalesChannel | typeof CHANNEL_ALL>(CHANNEL_ALL);
  const [status, setStatus] = useState<OrderStatus | typeof STATUS_ALL>(STATUS_ALL);
  const [sort, setSort] = useState<string>("createdAt:DESC");
  const [offset, setOffset] = useState(0);

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
            setChannel(value as SalesChannel | typeof CHANNEL_ALL);
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
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell className="font-mono text-xs">
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        {order.code}
                      </span>
                    </TableCell>
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
                        className="block max-w-32 truncate text-xs 2xl:max-w-48"
                        title={formatAddress(order.customerAddress)}
                      >
                        {formatAddress(order.customerAddress)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-56 flex-col gap-0.5">
                        {order.lines.map((line) => (
                          <span
                            key={line.id}
                            className="truncate text-xs"
                            title={`${line.snapItem.name} × ${line.quantity}`}
                          >
                            {line.snapItem.name}
                            <span className="text-muted-foreground"> × {line.quantity}</span>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{formatPriceVn(order.totalAmount)}</TableCell>
                    <TableCell>
                      <SalesChannelBadge channel={order.channel} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">Payment:</span>
                          <Badge
                            label={capitalize(order.paymentStatus)}
                            className={PAYMENT_STATUS_CLASS[order.paymentStatus]}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">Status:</span>
                          <Badge
                            label={capitalize(order.status)}
                            className={ORDER_STATUS_CLASS[order.status]}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleString("en-GB")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="View order"
                        title="View order"
                        onClick={() => navigate(`/orders/${order.id}`)}
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
    </div>
  );
}

function formatAddress(address: Address): string {
  const country =
    COUNTRIES[address.countryCode as keyof typeof COUNTRIES]?.viName ?? address.countryCode;
  return [address.address, address.provinceName, country].filter(Boolean).join(", ");
}

