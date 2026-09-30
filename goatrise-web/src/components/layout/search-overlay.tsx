import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

import type { Product } from "@/api/product/api";
import { productsQueryOptions } from "@/api/product/query-hooks";
import { ProductCard } from "@/components/shared/product-card";
import { RollText } from "@/components/shared/roll-text";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { normalizeText } from "@/lib/utils";
import { useSearchStore } from "@/stores/search.store";

// số sản phẩm bán chạy gợi ý khi chưa gõ gì / không có kết quả
const SUGGESTION_LIMIT = 4;

const LABEL_CLASS =
  "text-[11px] font-bold tracking-[0.14em] uppercase tabular-nums opacity-55";

export function SearchOverlay() {
  const isOpen = useSearchStore((s) => s.isOpen);
  const setOpen = useSearchStore((s) => s.setOpen);
  const openSearch = useSearchStore((s) => s.openSearch);
  const closeSearch = useSearchStore((s) => s.closeSearch);
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  // gõ nhanh thì input vẫn mượt, lưới kết quả cập nhật sau một nhịp
  const deferredQuery = useDeferredValue(query);

  // chỉ fetch khi mở panel; tái dùng cache của /api/products nếu đã có
  const { data: products, isPending } = useQuery({
    ...productsQueryOptions(),
    enabled: isOpen,
  });

  const activeProducts = useMemo(
    () => (products ?? []).filter((product) => product.isActive),
    [products]
  );

  // chuẩn hóa sẵn chữ để tìm của từng sản phẩm, tránh bỏ dấu lại mỗi lần gõ
  const indexed = useMemo(
    () =>
      activeProducts.map((product) => ({
        product,
        title: normalizeText(`${product.title.vi} ${product.title.en}`),
        haystack: normalizeText(
          [
            product.title.vi,
            product.title.en,
            product.shortDescription.vi,
            ...product.items.flatMap((item) => [item.sku, item.name]),
          ].join(" ")
        ),
      })),
    [activeProducts]
  );

  const results = useMemo(
    () => searchProducts(indexed, deferredQuery),
    [indexed, deferredQuery]
  );

  const bestSellers = useMemo(
    () =>
      [...activeProducts]
        .sort((a, b) => b.sold - a.sold)
        .slice(0, SUGGESTION_LIMIT),
    [activeProducts]
  );

  const trimmedQuery = deferredQuery.trim();

  // phím tắt: "/" hoặc Ctrl/Cmd + K mở tìm kiếm ở bất kỳ trang nào
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        (event.key === "/" && !isTypingTarget(event.target)) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");
      if (!isShortcut) return;
      event.preventDefault();
      openSearch();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  function goToProduct(product: Product) {
    closeSearch();
    void navigate({ to: "/products/$slug", params: { slug: product.slug } });
  }

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="top"
        showCloseButton={false}
        className="max-h-[90svh] gap-0 p-0"
      >
        <SheetTitle className="sr-only">Tìm kiếm sản phẩm</SheetTitle>
        <SheetDescription className="sr-only">
          Gõ tên sản phẩm để tìm, nhấn Enter để mở kết quả đầu tiên
        </SheetDescription>

        {/* Hàng nhập: cùng lưới ngang với header */}
        <div className="border-b border-border">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              if (results[0]) goToProduct(results[0]);
            }}
            className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-3 px-5 md:h-20 md:gap-5 lg:px-10"
          >
            <Search
              aria-hidden
              className="size-5 shrink-0 opacity-50"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sản phẩm"
              aria-label="Tìm sản phẩm"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              className="h-full min-w-0 flex-1 bg-transparent font-logo text-xl font-extrabold tracking-[-0.02em] outline-none placeholder:text-foreground/25 md:text-3xl [&::-webkit-search-cancel-button]:hidden"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Xóa nội dung tìm kiếm"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center opacity-50 transition-opacity hover:opacity-100"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            ) : null}

            <SheetClose asChild>
              <button
                type="button"
                className="group flex shrink-0 cursor-pointer items-center gap-2 text-[11px] font-bold tracking-[0.08em] uppercase opacity-60 transition-opacity hover:opacity-100"
              >
                <RollText label="Đóng" />
                <kbd className="hidden border border-border px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-normal normal-case md:inline">
                  Esc
                </kbd>
              </button>
            </SheetClose>
          </form>
        </div>

        {/* Kết quả: tự cuộn, Lenis phải nhả wheel ra */}
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto"
          // bấm vào thẻ sản phẩm (là link) thì đóng panel
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) closeSearch();
          }}
        >
          <div className="mx-auto w-full max-w-[1500px] px-5 py-8 lg:px-10 lg:py-10">
            {isPending ? (
              <p className={LABEL_CLASS}>Đang tải…</p>
            ) : trimmedQuery === "" ? (
              <ResultSection title="Bán chạy" products={bestSellers} />
            ) : results.length > 0 ? (
              <ResultSection
                title={`${results.length} kết quả cho “${trimmedQuery}”`}
                products={results}
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Không tìm thấy sản phẩm nào cho “{trimmedQuery}”. Thử từ khóa
                  ngắn hơn hoặc gõ không dấu.
                </p>
                <div className="mt-10">
                  <ResultSection title="Có thể bạn thích" products={bestSellers} />
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ResultSection({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section>
      <h2 className={LABEL_CLASS}>{title}</h2>
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

type IndexedProduct = {
  product: Product;
  title: string;
  haystack: string;
};

// mọi từ trong câu tìm phải có mặt; khớp ở tên được ưu tiên hơn khớp ở mô tả/SKU
function searchProducts(indexed: IndexedProduct[], rawQuery: string): Product[] {
  const query = normalizeText(rawQuery.trim());
  if (!query) return [];
  const tokens = query.split(/\s+/);

  return indexed
    .map(({ product, title, haystack }) => {
      if (!tokens.every((token) => haystack.includes(token))) {
        return null;
      }
      const score = title.startsWith(query)
        ? 3
        : title.includes(query)
          ? 2
          : tokens.every((token) => title.includes(token))
            ? 1
            : 0;
      return { product, score };
    })
    .filter((match): match is { product: Product; score: number } => match !== null)
    .sort((a, b) => b.score - a.score || b.product.sold - a.product.sold)
    .map((match) => match.product);
}

// đang gõ trong ô nhập thì "/" là ký tự bình thường, không phải phím tắt
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}
