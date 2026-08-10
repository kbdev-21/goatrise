import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import type { ProductDetail } from "@/api/product/api";
import { Button } from "@/components/ui/button";
import { cn, getColorName } from "@/lib/utils";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const images = product.imgUrls ?? [];

  const category = product.collections.find((c) => c.type === "CATEGORY");

  const colors = useMemo(
    () =>
      [
        ...new Set(
          [...product.items]
            .sort((a, b) => b.displayPriority - a.displayPriority)
            .map((item) => item.attributeValues.COLOR)
            .filter((c): c is string => Boolean(c))
        ),
      ],
    [product.items]
  );

  const sizes = useMemo(
    () =>
      [
        ...new Set(
          product.items
            .map((item) => item.attributeValues.SIZE)
            .filter((s): s is string => Boolean(s))
        ),
      ].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)),
    [product.items]
  );

  const [selectedColor, setSelectedColor] = useState(colors[0] ?? null);
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? null);
  const [quantity, setQuantity] = useState(1);

  const price = product.displayPrice ?? product.items[0]?.price ?? null;
  const hasDiscount =
    product.comparePrice !== null && price !== null && product.comparePrice > price;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-0 pb-10 lg:pt-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start lg:gap-x-0">
        {/* Gallery */}
        {images.length === 0 ? (
          <div className="flex aspect-square w-full items-center justify-center bg-muted text-sm text-muted-foreground">
            Chưa có ảnh
          </div>
        ) : (
          <div>
            {/* Mobile: slider 1 ảnh/lần */}
            <div className="-mx-6 lg:mx-0 lg:hidden">
              <Swiper
                style={
                  {
                    "--swiper-pagination-color": "var(--foreground)",
                  } as React.CSSProperties
                }
                modules={[Pagination]}
                pagination={{ clickable: true }}
                slidesPerView={1}
                spaceBetween={0}
              >
                {images.map((url, i) => (
                  <SwiperSlide key={url}>
                    <div className="aspect-square w-full overflow-hidden bg-muted">
                      <img
                        src={url}
                        alt={`${product.title.vi} ${i + 1}`}
                        className="size-full object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Desktop: toàn bộ ảnh xếp dọc từ trên xuống */}
            <div className="hidden flex-col gap-3 lg:flex">
              {images.map((url, i) => (
                <div
                  key={url}
                  className="aspect-square w-full overflow-hidden bg-muted"
                >
                  <img
                    src={url}
                    alt={`${product.title.vi} ${i + 1}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info: stick lại khi cột ảnh còn scroll */}
        <div className="lg:sticky lg:top-20 lg:self-start lg:pl-16">
          {category ? (
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              {category.title.vi}
            </p>
          ) : null}

          <h1 className="mt-2 text-2xl font-bold tracking-tight uppercase">
            {product.title.vi}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            {price === null ? (
              <span className="text-xl font-bold">Liên hệ</span>
            ) : (
              <>
                <span className="text-lg font-medium">{formatPrice(price)}</span>
                {hasDiscount ? (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.comparePrice!)}
                  </span>
                ) : null}
              </>
            )}
          </div>

          <p className="mt-5 max-w-md text-sm font-light leading-relaxed">
            {product.shortDescription.vi}
          </p>

          {/* Color */}
          {colors.length > 0 ? (
            <div className="mt-8">
              <p className="text-[11px] font-semibold tracking-widest uppercase">
                Màu sắc
                {selectedColor ? (
                  <span className="text-muted-foreground">
                    : {getColorName(selectedColor)}
                  </span>
                ) : null}
              </p>
              <div className="mt-3 flex items-center gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={cn(
                      "size-7 cursor-pointer rounded-full ring-1 ring-foreground/20 ring-inset transition-shadow",
                      selectedColor === color &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    )}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Size */}
          {sizes.length > 0 ? (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-widest uppercase">
                  Size
                </p>
                <button
                  type="button"
                  className="cursor-pointer text-xs tracking-wide text-muted-foreground uppercase hover:text-foreground"
                >
                  Bảng size
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "flex h-9 min-w-11 cursor-pointer items-center justify-center border px-2.5 text-[11px] font-medium transition-colors",
                      selectedSize === size
                        ? "border-foreground bg-background text-foreground"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Quantity */}
          <div className="mt-6">
            <p className="text-[11px] font-semibold tracking-widest uppercase">
              Số lượng
            </p>
            <div className="mt-3 flex h-9 w-24 items-center justify-between border border-border">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex size-9 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="size-3" />
              </button>
              <span className="text-[11px] font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex size-9 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Button className="h-12 w-full rounded-none bg-foreground text-background text-xs font-bold tracking-widest uppercase hover:bg-foreground/90">
              Thêm vào giỏ hàng
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full rounded-none text-xs font-bold tracking-widest uppercase"
            >
              Mua ngay
            </Button>
          </div>

          {/* Accordions */}
          <div className="mt-8 border-t border-border">
            <Accordion title="Thông tin chi tiết">
              {product.markdownDescription?.vi ? (
                <p className="whitespace-pre-line">
                  {product.markdownDescription.vi}
                </p>
              ) : (
                <p className="text-muted-foreground">Đang cập nhật.</p>
              )}
            </Accordion>
            <Accordion title="Chính sách">
              <p className="text-muted-foreground">Đang cập nhật.</p>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}

function Accordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between py-4 text-left"
      >
        <span className="text-xs font-bold tracking-widest uppercase">
          {title}
        </span>
        <span className="relative size-2.5 shrink-0">
          <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 bg-current" />
          <span
            className={cn(
              "absolute top-1/2 left-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300 ease-out",
              open ? "scale-y-0" : "scale-y-100"
            )}
          />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-sm font-light leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
