import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";

import { productsQueryOptions } from "@/api/product/query-hooks";
import { collectionsQueryOptions } from "@/api/collection/query-hooks";
import type { Product } from "@/api/product/api";
import type { Collection } from "@/api/collection/api";
import { ProductCard } from "@/components/shared/product-card";
import { Select } from "@/components/ui/select";
import { RangeSlider, type Range } from "@/components/ui/range-slider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice, getColorName } from "@/lib/utils";

// bước nhảy của thanh trượt giá (VND)
const PRICE_STEP = 10_000;

const SORT_OPTIONS = [
  { value: "featured", label: "Nổi bật" },
  { value: "best-selling", label: "Bán chạy" },
  { value: "newest", label: "Mới nhất" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type ProductsSearch = {
  // các bộ lọc chọn nhiều: giá trị nối bằng dấu phẩy, vd "men,women" / "black,white"
  category?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortValue;
};

type MultiFilterKey = "category" | "color";

export const Route = createFileRoute("/products")({
  // bộ lọc nằm trên URL để F5 / chia sẻ link vẫn giữ nguyên
  validateSearch: (search: Record<string, unknown>): ProductsSearch => ({
    category: asString(search.category),
    color: asString(search.color),
    minPrice: asPrice(search.minPrice),
    maxPrice: asPrice(search.maxPrice),
    sort: SORT_OPTIONS.some((option) => option.value === search.sort)
      ? (search.sort as SortValue)
      : undefined,
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions()),
      context.queryClient.ensureQueryData(collectionsQueryOptions()),
    ]),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions());
  const { data: collections } = useSuspenseQuery(collectionsQueryOptions());
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive),
    [products]
  );

  const activeCollections = useMemo(
    () =>
      collections
        .filter((collection) => collection.isActive)
        .sort((a, b) => b.displayPriority - a.displayPriority),
    [collections]
  );

  // slug -> id sản phẩm thuộc collection đó (gồm cả collection con)
  const productIdsBySlug = useMemo(() => {
    const byId = new Map(collections.map((c) => [c.id, c]));
    return new Map(
      activeCollections.map((c) => [c.slug, collectProductIds(c, byId)])
    );
  }, [collections, activeCollections]);

  // color-namer khá nặng, tính 1 lần cho mỗi mã hex
  const colorNameByHex = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of activeProducts) {
      for (const item of product.items) {
        const hex = item.attributeValues.COLOR;
        if (hex && !map.has(hex)) {
          map.set(hex, getColorName(hex));
        }
      }
    }
    return map;
  }, [activeProducts]);

  const categories = useMemo(
    () => activeCollections.filter((c) => c.type === "CATEGORY"),
    [activeCollections]
  );

  // gom theo tên màu: nhiều mã hex gần nhau hiện chung một lựa chọn
  const colorOptions = useMemo(() => {
    const firstHexByName = new Map<string, string>();
    for (const [hex, name] of colorNameByHex) {
      if (!firstHexByName.has(name)) {
        firstHexByName.set(name, hex);
      }
    }
    return [...firstHexByName]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, hex]) => ({ name, hex }));
  }, [colorNameByHex]);

  // giá trị trên URL không còn tồn tại (danh mục đã tắt, màu đã hết...) thì bỏ qua
  const selectedCategories = useMemo(
    () =>
      parseList(search.category).filter((slug) =>
        categories.some((c) => c.slug === slug)
      ),
    [search.category, categories]
  );
  const selectedColors = useMemo(
    () =>
      parseList(search.color).filter((name) =>
        colorOptions.some((option) => option.name === name)
      ),
    [search.color, colorOptions]
  );

  // biên của thanh trượt: giá thấp nhất / cao nhất, làm tròn ra theo PRICE_STEP
  const priceBounds = useMemo((): Range | null => {
    const prices = activeProducts
      .map(getPrice)
      .filter((price): price is number => price !== null);
    if (prices.length === 0) return null;

    const min = Math.floor(Math.min(...prices) / PRICE_STEP) * PRICE_STEP;
    const max = Math.ceil(Math.max(...prices) / PRICE_STEP) * PRICE_STEP;
    return min < max ? [min, max] : null;
  }, [activeProducts]);

  // khoảng giá đang áp dụng (từ URL), kẹp lại trong biên cho khỏi lệch
  const priceRange = useMemo((): Range | null => {
    if (!priceBounds) return null;
    const [lower, upper] = priceBounds;
    const from = clamp(search.minPrice ?? lower, lower, upper);
    const to = clamp(search.maxPrice ?? upper, lower, upper);
    return from <= to ? [from, to] : [to, from];
  }, [priceBounds, search.minPrice, search.maxPrice]);

  const isPriceFiltered =
    priceBounds !== null &&
    priceRange !== null &&
    (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]);

  const visibleProducts = useMemo(() => {
    const categoryIdSets = selectedCategories
      .map((slug) => productIdsBySlug.get(slug))
      .filter((ids): ids is Set<string> => ids !== undefined);

    const filtered = activeProducts.filter((product) => {
      // tick nhiều danh mục: thuộc bất kỳ danh mục nào là được
      if (
        categoryIdSets.length > 0 &&
        !categoryIdSets.some((ids) => ids.has(product.id))
      ) {
        return false;
      }
      if (isPriceFiltered && priceRange) {
        const price = getPrice(product);
        // đang lọc giá thì bỏ sản phẩm "Liên hệ"
        if (price === null || price < priceRange[0] || price > priceRange[1]) {
          return false;
        }
      }
      if (selectedColors.length === 0) return true;

      // có ít nhất một biến thể còn bán mang màu đã tick (tick nhiều: khớp màu nào cũng được)
      return product.items.some((item) => {
        if (!item.isActive) return false;
        const { COLOR } = item.attributeValues;
        const colorName = COLOR ? colorNameByHex.get(COLOR) : undefined;
        return colorName !== undefined && selectedColors.includes(colorName);
      });
    });

    return sortProducts(filtered, search.sort ?? "featured");
  }, [
    activeProducts,
    selectedCategories,
    selectedColors,
    productIdsBySlug,
    colorNameByHex,
    isPriceFiltered,
    priceRange,
    search.sort,
  ]);

  const hasFilter =
    selectedCategories.length > 0 ||
    selectedColors.length > 0 ||
    isPriceFiltered;

  function setSort(value: string) {
    navigate({
      search: (prev) => ({
        ...prev,
        sort: value === "featured" ? undefined : (value as SortValue),
      }),
      replace: true,
      resetScroll: false,
    });
  }

  // tick / bỏ tick một giá trị trong bộ lọc chọn nhiều
  function toggleValue(key: MultiFilterKey, selected: string[], value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];

    navigate({
      search: (prev) => ({
        ...prev,
        [key]: next.length > 0 ? next.join(",") : undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  function setPriceRange([from, to]: Range) {
    if (!priceBounds) return;
    navigate({
      search: (prev) => ({
        ...prev,
        // chạm biên thì bỏ khỏi URL, coi như không giới hạn phía đó
        minPrice: from > priceBounds[0] ? from : undefined,
        maxPrice: to < priceBounds[1] ? to : undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  function clearFilters() {
    navigate({
      search: (prev) => ({ sort: prev.sort }),
      replace: true,
      resetScroll: false,
    });
  }

  // dùng chung cho sidebar desktop và bảng lọc mobile
  const filterPanel = (
    <div className="flex flex-col gap-8">
      <FilterSection title="Sắp xếp">
        <Select
          label="Sắp xếp"
          showLabel={false}
          items={[...SORT_OPTIONS]}
          value={search.sort ?? "featured"}
          onChange={setSort}
          className="w-full"
        />
      </FilterSection>

      {priceBounds && priceRange ? (
        <FilterSection title="Giá">
          <PriceFilter
            bounds={priceBounds}
            value={priceRange}
            onCommit={setPriceRange}
          />
        </FilterSection>
      ) : null}

      {categories.length > 0 ? (
        <FilterSection title="Danh mục">
          <ul className="flex flex-col">
            {categories.map((category) => (
              <li key={category.id}>
                <Checkbox
                  label={category.title.vi}
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={() =>
                    toggleValue("category", selectedCategories, category.slug)
                  }
                />
              </li>
            ))}
          </ul>
        </FilterSection>
      ) : null}

      {colorOptions.length > 0 ? (
        <FilterSection title="Màu sắc">
          <ul className="flex flex-col">
            {colorOptions.map(({ name, hex }) => (
              <li key={name}>
                <Checkbox
                  label={
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        style={{ backgroundColor: hex }}
                        className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/30 ring-inset"
                      />
                      <span className="capitalize">{name}</span>
                    </span>
                  }
                  checked={selectedColors.includes(name)}
                  onCheckedChange={() =>
                    toggleValue("color", selectedColors, name)
                  }
                />
              </li>
            ))}
          </ul>
        </FilterSection>
      ) : null}

      {hasFilter ? (
        <button
          type="button"
          onClick={clearFilters}
          className="h-10 cursor-pointer border border-border text-[11px] font-bold tracking-[0.08em] uppercase transition-colors hover:border-foreground"
        >
          Xóa bộ lọc
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1500px] px-5 pt-10 pb-20 lg:px-10 lg:pt-16 lg:pb-28">
      <div className="flex items-end justify-between gap-6">
        <h1 className="font-logo text-[clamp(1.75rem,5vw,3.5rem)] leading-none font-extrabold tracking-[-0.03em] uppercase">
          Sản phẩm
        </h1>
        <p className="shrink-0 pb-1 text-[11px] font-bold tracking-[0.14em] uppercase tabular-nums opacity-55">
          {visibleProducts.length} sản phẩm
        </p>
      </div>

      <div className="mt-8 border-t border-border pt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        {/* Desktop: sidebar lọc + sắp xếp, dính theo khi cuộn */}
        <aside
          aria-label="Bộ lọc sản phẩm"
          // tự cuộn khi dài hơn màn hình; Lenis phải nhả wheel ra
          data-lenis-prevent
          className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100svh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-1"
        >
          {filterPanel}
        </aside>

        <div>
          {/* Mobile: không đủ chỗ cho sidebar nên mở bảng lọc từ cạnh trái */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="mb-6 flex h-10 w-full cursor-pointer items-center justify-center gap-2 border border-border text-[11px] font-bold tracking-[0.08em] uppercase transition-colors hover:border-foreground lg:hidden"
              >
                <SlidersHorizontal className="size-3.5" strokeWidth={1.75} />
                Bộ lọc &amp; sắp xếp
                {hasFilter ? (
                  <span aria-hidden className="size-1.5 rounded-full bg-foreground" />
                ) : null}
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[min(22rem,90vw)] p-0">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle className="text-xs font-bold tracking-widest uppercase">
                  Bộ lọc &amp; sắp xếp
                </SheetTitle>
              </SheetHeader>
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-6">
                {filterPanel}
              </div>
              <div className="border-t border-border p-6">
                <SheetClose asChild>
                  <Button className="h-12 w-full rounded-none bg-foreground text-xs font-bold tracking-widest text-background uppercase hover:bg-foreground/90">
                    Xem {visibleProducts.length} sản phẩm
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          {visibleProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-5 py-24 text-center">
              <p className="text-sm text-muted-foreground">
                {hasFilter
                  ? "Không có sản phẩm nào phù hợp với bộ lọc."
                  : "Chưa có sản phẩm nào."}
              </p>
              {hasFilter ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-12 cursor-pointer border border-border px-8 text-xs font-bold tracking-widest uppercase transition-colors hover:border-foreground"
                >
                  Xóa bộ lọc
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PriceFilter({
  bounds,
  value,
  onCommit,
}: {
  bounds: Range;
  value: Range;
  onCommit: (value: Range) => void;
}) {
  // giá trị tạm lúc đang kéo; chỉ đẩy lên URL khi thả tay
  const [draft, setDraft] = useState<Range | null>(null);
  const [from, to] = draft ?? value;

  // URL đổi (thả tay xong, bấm "Xóa bộ lọc"...) thì bỏ giá trị tạm
  useEffect(() => {
    setDraft(null);
  }, [value[0], value[1]]);

  return (
    <div className="flex flex-col gap-3">
      <RangeSlider
        min={bounds[0]}
        max={bounds[1]}
        step={PRICE_STEP}
        value={[from, to]}
        onValueChange={setDraft}
        onValueCommit={onCommit}
        thumbLabels={["Giá thấp nhất", "Giá cao nhất"]}
      />
      <div className="flex items-center justify-between text-xs tabular-nums">
        <span>{formatPrice(from)}</span>
        <span>{formatPrice(to)}</span>
      </div>
    </div>
  );
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

// giá trên URL có thể là số hoặc chuỗi số; giá âm / rác thì bỏ qua
function asPrice(value: unknown): number | undefined {
  const price = typeof value === "string" ? Number(value) : value;
  return typeof price === "number" && Number.isFinite(price) && price >= 0
    ? price
    : undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// "a,b,c" trên URL -> ["a", "b", "c"]
function parseList(value: string | undefined): string[] {
  return value?.split(",").filter(Boolean) ?? [];
}

// gom id sản phẩm của collection và toàn bộ collection con (đệ quy, chống vòng lặp)
function collectProductIds(
  collection: Collection,
  byId: Map<string, Collection>,
  visited = new Set<string>()
): Set<string> {
  visited.add(collection.id);
  const ids = new Set(collection.products.map((product) => product.id));

  for (const child of collection.children) {
    const fullChild = byId.get(child.id);
    if (!fullChild || visited.has(fullChild.id) || !fullChild.isActive) continue;
    for (const id of collectProductIds(fullChild, byId, visited)) {
      ids.add(id);
    }
  }
  return ids;
}

// cùng công thức giá với ProductCard
function getPrice(product: Product): number | null {
  return product.displayPrice ?? product.items[0]?.price ?? null;
}

function sortProducts(products: Product[], sort: SortValue): Product[] {
  const sorted = [...products];

  switch (sort) {
    case "best-selling":
      return sorted.sort((a, b) => b.sold - a.sold);
    case "newest":
      return sorted.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );
    case "price-asc":
    case "price-desc": {
      const direction = sort === "price-asc" ? 1 : -1;
      return sorted.sort((a, b) => {
        const priceA = getPrice(a);
        const priceB = getPrice(b);
        // sản phẩm "Liên hệ" (không có giá) luôn nằm cuối
        if (priceA === null) return priceB === null ? 0 : 1;
        if (priceB === null) return -1;
        return (priceA - priceB) * direction;
      });
    }
    default:
      return sorted.sort((a, b) => b.displayPriority - a.displayPriority);
  }
}
