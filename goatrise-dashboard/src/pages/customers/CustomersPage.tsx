import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCustomers } from "@/api/customer/query-hooks.ts";
import { formatPriceVn } from "@/core/utils.ts";
import { SalesChannelBadge } from "@/components/shared/sales-channel-badge.tsx";
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {customersQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-destructive text-center">
                    Failed to load customers.
                  </TableCell>
                </TableRow>
              ) : !customersQuery.data || customersQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground text-center">
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
    </div>
  );
}
