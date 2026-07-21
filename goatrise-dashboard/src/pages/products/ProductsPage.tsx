import { useMemo, useState } from "react";
import { Eye, ImageOff, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/api/product/query-hooks.ts";
import type { Product } from "@/api/product/api.ts";
import { ActiveBadge } from "@/components/shared/active-badge.tsx";
import { capitalize, formatPriceVn, normalizeVietnameseString } from "@/core/utils.ts";
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

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: "Newest", value: "createdAt:DESC" },
  { label: "Oldest", value: "createdAt:ASC" },
];

export default function ProductsPage() {
  // ----- client-side query state -----
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("createdAt:DESC");

  const navigate = useNavigate();

  // fetch toàn bộ 1 lần rồi filter phía client
  const productsQuery = useProducts();

  function commitSearch() {
    setSearch(searchInput.trim());
  }

  const filteredProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    const keyword = normalizeVietnameseString(search);
    if (!keyword) return products;
    return products.filter((product) =>
      normalizeVietnameseString(
        `${product.slug} ${product.title.en} ${product.title.vi}`,
      ).includes(keyword),
    );
  }, [productsQuery.data, search]);

  const sortedProducts = useMemo(() => {
    const [field, direction] = sort.split(":");
    const factor = direction === "ASC" ? 1 : -1;
    return [...filteredProducts].sort((a, b) => {
      let cmp = 0;
      switch (field) {
        default:
          cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return cmp * factor;
    });
  }, [filteredProducts, sort]);

  return (
    <div className="flex min-h-svh flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Products</h1>

      {/* ----- filters ----- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search slug or name..."
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
          onClick={() => navigate("/products/create")}
        >
          <Plus className="size-4" />
          New Product
        </Button>
      </div>

      {/* ----- table ----- */}
      {productsQuery.isLoading ? (
        <div className="bg-card flex items-center justify-center rounded-md border p-6">
          <Spinner className="text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Display price</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-destructive text-center">
                    Failed to load products.
                  </TableCell>
                </TableRow>
              ) : sortedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.slug}</TableCell>
                    <TableCell className="font-medium">
                      <div
                        className="flex w-fit cursor-pointer items-center gap-2"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <ProductImage product={product} />
                        <span className="hover:underline">{product.title.en}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{minItemPrice(product)}</span>
                        {product.comparePrice !== null && (
                          <span className="text-muted-foreground text-xs line-through">
                            {formatPriceVn(product.comparePrice)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        {product.requiredAttributes.length > 0
                          ? product.requiredAttributes.map(capitalize).join(", ")
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        {product.items.length} item{product.items.length === 1 ? "" : "s"}
                      </span>
                    </TableCell>
                    <TableCell>{product.sold}</TableCell>
                    <TableCell>
                      <ActiveBadge isActive={product.isActive} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="View details"
                          title="View details"
                          onClick={() => navigate(`/products/${product.id}`)}
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
        {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
        {productsQuery.isFetching ? " · updating..." : ""}
      </span>
    </div>
  );
}

function minItemPrice(product: Product): string {
  if (product.items.length === 0) return "—";
  const min = Math.min(...product.items.map((item) => Number(item.price)));
  return min.toLocaleString("vi-VN");
}

function ProductImage({ product }: { product: Product }) {
  const [error, setError] = useState(false);
  const imgUrl = product.imgUrls?.[0];
  return imgUrl && !error ? (
    <img
      src={imgUrl}
      alt={product.title.en}
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
