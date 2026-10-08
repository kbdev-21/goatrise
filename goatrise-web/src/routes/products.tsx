import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, SlidersHorizontal, X } from "lucide-react";

import { productsQueryOptions } from "@/api/product/query-hooks";
import { collectionsQueryOptions } from "@/api/collection/query-hooks";
import type { Product } from "@/api/product/api";
import type { Collection } from "@/api/collection/api";
import { ProductCard } from "@/components/shared/product-card";
import { Reveal } from "@/components/shared/reveal";
import { Select } from "@/components/ui/select";
import { RangeSlider, type Range } from "@/components/ui/range-slider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn, formatPrice, getColorName } from "@/lib/utils";

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
  // slug của một danh mục; không có = tất cả
  category?: string;
  // chọn nhiều màu: tên màu nối bằng dấu phẩy, vd "black,white"
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortValue;
};

// nhãn nhỏ uppercase dùng chung cho thanh công cụ, chip, nút trong bảng lọc
const LABEL_CLASS = "text-[11px] font-bold tracking-[0.08em] uppercase";

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

  // slug danh mục -> id các sản phẩm đang bán thuộc nó (gồm cả danh mục con)
  const productIdsByCategory = useMemo(() => {
    const byId = new Map(collections.map((c) => [c.id, c]));
    const activeIds = new Set(activeProducts.map((product) => product.id));
    return new Map(
      collections
        .filter((c) => c.isActive && c.type === "CATEGORY")
        .map((c) => [
          c.slug,
          new Set(
            [...collectProductIds(c, byId)].filter((id) => activeIds.has(id))
          ),
        ])
    );
  }, [collections, activeProducts]);

  // danh mục đang bật và còn sản phẩm, priority cao lên trước; danh mục rỗng thì ẩn
  const categories = useMemo(
    () =>
      collections
        .filter(
          (c) =>
            c.isActive &&
            c.type === "CATEGORY" &&
            (productIdsByCategory.get(c.slug)?.size ?? 0) > 0
        )
        .sort((a, b) => b.displayPriority - a.displayPriority),
    [collections, productIdsByCategory]
  );

  // cấp 1: cha không nằm trong danh sách đang hiện (không có cha, cha tắt / rỗng...)
  const topCategories = useMemo(() => {
    const shownIds = new Set(categories.map((c) => c.id));
    return categories.filter((c) => !c.parentId || !shownIds.has(c.parentId));
  }, [categories]);

  // slug trên URL không còn tồn tại (danh mục đã tắt / rỗng) thì coi như "Tất cả"
  const selectedCategory =
    categories.find((c) => c.slug === search.category) ?? null;

  // chuỗi từ danh mục đang chọn ngược lên cấp 1: [đang chọn, cha, ..., cấp 1]
  const categoryTrail = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const trail: Collection[] = [];
    let current: Collection | undefined = selectedCategory ?? undefined;
    while (current && !trail.includes(current)) {
      trail.push(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return trail;
  }, [categories, selectedCategory]);

  const activeTop = categoryTrail.at(-1);
  const activeSub = categoryTrail.at(-2);

  // mobile: thanh danh mục cuộn ngang, kéo mục đang chọn vào giữa cho khỏi khuất
  const categoryListRef = useRef<HTMLUListElement>(null);
  // lần đầu (mở link có sẵn ?category=) nhảy thẳng tới, các lần bấm sau mới trượt
  const hasScrolledCategoryRef = useRef(false);
  useEffect(() => {
    const list = categoryListRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2,
      behavior: hasScrolledCategoryRef.current ? "smooth" : "instant",
    });
    hasScrolledCategoryRef.current = true;
  }, [activeTop?.id]);

  // hàng danh mục con chỉ hiện khi danh mục cấp 1 đang chọn có con
  const subCategories = activeTop
    ? categories.filter((c) => c.parentId === activeTop.id)
    : [];

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

  // màu trên URL không còn tồn tại (đã hết hàng...) thì bỏ qua
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
    const categoryIds = selectedCategory
      ? productIdsByCategory.get(selectedCategory.slug)
      : undefined;

    const filtered = activeProducts.filter((product) => {
      if (categoryIds && !categoryIds.has(product.id)) return false;
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
    selectedCategory,
    productIdsByCategory,
    selectedColors,
    colorNameByHex,
    isPriceFiltered,
    priceRange,
    search.sort,
  ]);

  // danh mục không tính là "bộ lọc": nó hiện sẵn trên thanh danh mục
  const filterCount = selectedColors.length + (isPriceFiltered ? 1 : 0);
  const hasFilter = filterCount > 0;

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

  function toggleColor(name: string) {
    const next = selectedColors.includes(name)
      ? selectedColors.filter((v) => v !== name)
      : [...selectedColors, name];

    navigate({
      search: (prev) => ({
        ...prev,
        color: next.length > 0 ? next.join(",") : undefined,
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

  function clearPrice() {
    navigate({
      search: (prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined }),
      replace: true,
      resetScroll: false,
    });
  }

  // xóa màu + giá, giữ danh mục và cách sắp xếp
  function clearFilters() {
    navigate({
      search: (prev) => ({ category: prev.category, sort: prev.sort }),
      replace: true,
      resetScroll: false,
    });
  }

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

      {/* Thanh công cụ: danh mục bên trái, sắp xếp + bộ lọc bên phải */}
      <div className="mt-8 flex flex-col gap-5 border-y border-border py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <nav aria-label="Danh mục sản phẩm" className="min-w-0">
          {/* mobile: một dòng cuộn ngang, tràn ra sát mép màn hình */}
          <ul
            ref={categoryListRef}
            className="relative -mx-5 flex [scrollbar-width:none] gap-x-6 gap-y-3 overflow-x-auto px-5 whitespace-nowrap lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <li>
              <CategoryLink
                label="Tất cả"
                slug={undefined}
                active={!activeTop}
              />
            </li>
            {topCategories.map((category) => (
              <li key={category.id}>
                <CategoryLink
                  label={category.title.vi}
                  slug={category.slug}
                  active={activeTop?.id === category.id}
                />
              </li>
            ))}
          </ul>

          {activeTop && subCategories.length > 0 ? (
            <ul className="-mx-5 mt-4 flex [scrollbar-width:none] gap-x-5 gap-y-2 overflow-x-auto px-5 whitespace-nowrap lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
              {[activeTop, ...subCategories].map((category) => {
                const isParent = category.id === activeTop.id;
                const active = isParent
                  ? !activeSub
                  : activeSub?.id === category.id;
                return (
                  <li key={category.id}>
                    <Link
                      to="/products"
                      search={(prev) => ({ ...prev, category: category.slug })}
                      replace
                      activeOptions={{ explicitUndefined: true }}
                      resetScroll={false}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "text-[13px] font-bold transition-opacity duration-300 hover:opacity-100",
                        active
                          ? "underline decoration-1 underline-offset-[6px]"
                          : "opacity-45"
                      )}
                    >
                      {isParent ? "Tất cả" : category.title.vi}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center justify-between gap-8">
          <Select
            label="Sắp xếp"
            items={[...SORT_OPTIONS]}
            value={search.sort ?? "featured"}
            onChange={setSort}
            // bỏ khung viền, chỉ còn chữ cho gọn cạnh nút Bộ lọc
            className="h-auto gap-1.5 border-0 bg-transparent px-0"
          />

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  LABEL_CLASS,
                  "-my-3 flex cursor-pointer items-center gap-2 py-3 transition-opacity duration-300 hover:opacity-60"
                )}
              >
                <SlidersHorizontal className="size-3.5" strokeWidth={1.75} />
                Bộ lọc
                {hasFilter ? (
                  <span className="tabular-nums opacity-55">
                    ({filterCount})
                  </span>
                ) : null}
              </button>
            </SheetTrigger>

            {/* mobile tràn hết màn hình; từ sm trở lên Sheet tự giới hạn max-w-sm */}
            <SheetContent side="right" className="p-0 data-[side=right]:w-full">
              <SheetHeader className="border-b border-border px-6 py-5">
                <SheetTitle className={LABEL_CLASS}>Bộ lọc</SheetTitle>
              </SheetHeader>

              <div
                // Lenis chặn wheel ở document, phải nhả ra để bảng tự cuộn được
                data-lenis-prevent
                className="flex flex-1 flex-col gap-10 overflow-y-auto p-6"
              >
                {priceBounds && priceRange ? (
                  <FilterSection title="Giá">
                    <PriceFilter
                      bounds={priceBounds}
                      value={priceRange}
                      onCommit={setPriceRange}
                    />
                  </FilterSection>
                ) : null}

                {colorOptions.length > 0 ? (
                  <FilterSection
                    title={
                      selectedColors.length > 0
                        ? `Màu sắc (${selectedColors.length})`
                        : "Màu sắc"
                    }
                  >
                    <ul className="grid grid-cols-4 gap-x-2 gap-y-5">
                      {colorOptions.map(({ name, hex }) => {
                        const checked = selectedColors.includes(name);
                        return (
                          <li key={name}>
                            <button
                              type="button"
                              aria-pressed={checked}
                              onClick={() => toggleColor(name)}
                              className="group flex w-full cursor-pointer flex-col items-center gap-1.5 text-center"
                            >
                              <span
                                aria-hidden
                                style={{ backgroundColor: hex }}
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-full ring-1 ring-foreground/20 transition-shadow ring-inset group-hover:ring-foreground/50",
                                  checked &&
                                    "outline-1 outline-offset-2 outline-foreground",
                                  isLightColor(hex)
                                    ? "text-black"
                                    : "text-white"
                                )}
                              >
                                {checked ? (
                                  <Check className="size-4" strokeWidth={3} />
                                ) : null}
                              </span>
                              <span className="text-xs leading-tight capitalize">
                                {name}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </FilterSection>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-border p-6">
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasFilter}
                  className={cn(
                    LABEL_CLASS,
                    "h-12 cursor-pointer border border-border transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border"
                  )}
                >
                  Xóa bộ lọc
                </button>
                <SheetClose asChild>
                  <button
                    type="button"
                    className={cn(
                      LABEL_CLASS,
                      "h-12 cursor-pointer bg-foreground text-background tabular-nums transition-colors hover:bg-foreground/85"
                    )}
                  >
                    Xem {visibleProducts.length} sản phẩm
                  </button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bộ lọc đang áp dụng: bấm vào chip để bỏ từng cái */}
      {hasFilter ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isPriceFiltered && priceRange ? (
            <FilterChip
              label={`${formatPrice(priceRange[0])} – ${formatPrice(priceRange[1])}`}
              onRemove={clearPrice}
            />
          ) : null}
          {selectedColors.map((name) => (
            <FilterChip
              key={name}
              label={name}
              swatch={colorOptions.find((option) => option.name === name)?.hex}
              onRemove={() => toggleColor(name)}
            />
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className={cn(
              LABEL_CLASS,
              "ml-2 cursor-pointer underline decoration-1 underline-offset-4 opacity-55 transition-opacity hover:opacity-100"
            )}
          >
            Xóa tất cả
          </button>
        </div>
      ) : null}

      <div className="mt-8 lg:mt-10">
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
            {visibleProducts.map((product, index) => (
              // so le theo cột (tối đa 4) để hàng nào cũng hiện lần lượt, không dồn delay
              <Reveal key={product.id} delay={(index % 4) * 60}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// một mục trên thanh danh mục cấp 1: chữ lớn, viết thường
function CategoryLink({
  label,
  slug,
  active,
}: {
  label: string;
  slug: string | undefined;
  active: boolean;
}) {
  return (
    <Link
      to="/products"
      search={(prev) => ({ ...prev, category: slug })}
      replace
      // so cả category: undefined, không thì "Tất cả" luôn bị coi là active
      activeOptions={{ explicitUndefined: true }}
      resetScroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "font-logo text-[clamp(1rem,1.2vw,1.125rem)] leading-none font-semibold tracking-[-0.01em] transition-opacity duration-300 hover:opacity-100",
        !active && "opacity-40"
      )}
    >
      {label}
    </Link>
  );
}

function FilterChip({
  label,
  swatch,
  onRemove,
}: {
  label: string;
  swatch?: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Bỏ lọc ${label}`}
      className="flex h-8 cursor-pointer items-center gap-2 border border-border px-3 text-xs capitalize tabular-nums transition-colors hover:border-foreground"
    >
      {swatch ? (
        <span
          aria-hidden
          style={{ backgroundColor: swatch }}
          className="size-3 rounded-full ring-1 ring-foreground/30 ring-inset"
        />
      ) : null}
      {label}
      <X aria-hidden className="size-3 opacity-55" />
    </button>
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
    <section className="flex flex-col gap-4">
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

// màu nền sáng thì dấu tick đen, tối thì tick trắng (độ sáng cảm nhận theo YIQ)
function isLightColor(hex: string): boolean {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? [...value].map((char) => char + char).join("")
      : value.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150;
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
    if (!fullChild || visited.has(fullChild.id) || !fullChild.isActive)
      continue;
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
