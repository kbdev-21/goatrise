import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import type { ProductDetail } from "@/api/product/api";
import { RollText } from "@/components/shared/roll-text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useReveal } from "@/hooks/use-reveal";
import { cn, formatPrice, getColorName } from "@/lib/utils";
import { useCartStore } from "@/stores/cart.store";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const images = product.imgUrls ?? [];

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

  const addLine = useCartStore((s) => s.addLine);
  const galleryRef = useReveal<HTMLDivElement>();

  // requiredAttributes là nguồn đúng cho biết biến thể cần khớp thuộc tính nào
  const selectedItem = useMemo(() => {
    const required = product.requiredAttributes;
    return (
      product.items.find(
        (item) =>
          item.isActive &&
          (!required.includes("COLOR") || item.attributeValues.COLOR === selectedColor) &&
          (!required.includes("SIZE") || item.attributeValues.SIZE === selectedSize)
      ) ?? null
    );
  }, [product.items, product.requiredAttributes, selectedColor, selectedSize]);

  const price = product.displayPrice ?? product.items[0]?.price ?? null;
  const hasDiscount =
    product.comparePrice !== null && price !== null && product.comparePrice > price;

  return (
    <div className="mx-auto max-w-[1500px] px-6 pt-0 pb-10 lg:px-10 lg:pt-10">
      {/* desktop: 3 cột tên / ảnh / mua. mobile: 1 cột, sắp lại bằng order
          để giữ thứ tự ảnh -> tên -> chọn mua -> thông tin chi tiết */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-x-12 xl:gap-x-20">
        {/* Trái: tên + mô tả. mobile là display:contents để 2 khối con tách
            ra làm grid item riêng, đặt order được.
            desktop: stick ngay dưới header (h-16), cao tối thiểu bằng phần
            viewport còn lại và căn giữa dọc -> nội dung luôn nằm giữa màn.
            -mt-8: grid bắt đầu ở 6rem (main pt-14 + pt-10 ở trên) trong khi
            header chỉ cao 4rem, kéo lên 2rem để ngay đầu trang đã đúng vị trí
            stick, không bị thấp hơn tâm màn */}
        <div className="contents lg:sticky lg:top-16 lg:-mt-8 lg:flex lg:min-h-[calc(100svh-4rem)] lg:flex-col lg:justify-center lg:self-start lg:py-10">
          <div
            className="rise-fade order-2 lg:max-w-[360px]"
            style={{ "--rise-delay": "120ms" } as React.CSSProperties}
          >
            <h1 className="text-2xl font-bold tracking-tight uppercase">
              {product.title.vi}
            </h1>
            <p className="mt-5 text-sm font-light leading-relaxed">
              {product.shortDescription.vi}
            </p>
          </div>

          {/* Accordions */}
          <div
            className="rise-fade order-4 border-t border-border lg:mt-8 lg:max-w-[360px]"
            style={{ "--rise-delay": "180ms" } as React.CSSProperties}
          >
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

        {/* Giữa: Gallery */}
        {/* màn đầu hiện bằng CSS animation lúc tải trang, không chờ JS */}
        {images.length === 0 ? (
          <div className="rise-fade order-1 flex aspect-square w-full items-center justify-center bg-muted text-sm text-muted-foreground lg:order-none">
            Chưa có ảnh
          </div>
        ) : (
          <div className="rise-fade order-1 lg:order-none">
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
            <div ref={galleryRef} className="hidden flex-col gap-3 lg:flex">
              {images.map((url, i) => (
                <div
                  key={url}
                  // ảnh đầu đã hiện cùng cả cột, các ảnh sau hiện dần khi cuộn tới
                  data-reveal={i > 0 || undefined}
                  className="group aspect-square w-full overflow-hidden bg-muted"
                >
                  {/* zoom nhẹ khi hover, cùng nhịp với ảnh featured collections */}
                  <img
                    src={url}
                    alt={`${product.title.vi} ${i + 1}`}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phải: giá + chọn biến thể + nút mua, stick + căn giữa dọc như cột trái */}
        <div
          className="rise-fade order-3 lg:sticky lg:top-16 lg:-mt-8 lg:order-none lg:flex lg:min-h-[calc(100svh-4rem)] lg:w-full lg:max-w-[360px] lg:flex-col lg:justify-center lg:self-start lg:justify-self-end lg:py-10"
          style={{ "--rise-delay": "120ms" } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-3">
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
                      "size-7 cursor-pointer rounded-full ring-1 ring-foreground/20 ring-inset transition-[box-shadow,transform] duration-300 ease-smooth hover:scale-110",
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
                {/* chỉ hiện khi sản phẩm có ảnh bảng size */}
                {product.sizeImgUrl ? (
                  <SizeChartDialog
                    imgUrl={product.sizeImgUrl}
                    productTitle={product.title.vi}
                  />
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "flex h-9 min-w-11 cursor-pointer items-center justify-center border px-2.5 text-[11px] font-medium transition-colors duration-300",
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
                className="flex size-9 cursor-pointer items-center justify-center text-muted-foreground transition-colors duration-300 hover:text-foreground disabled:cursor-default disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="size-3" />
              </button>
              <span className="text-[11px] font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex size-9 cursor-pointer items-center justify-center text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                <Plus className="size-3" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Button
              disabled={!selectedItem}
              onClick={() =>
                selectedItem && addLine(selectedItem, product, quantity)
              }
              className="h-12 w-full rounded-none bg-foreground text-background text-xs font-bold tracking-widest uppercase duration-300 hover:bg-foreground/85"
            >
              {selectedItem ? "Thêm vào giỏ hàng" : "Hết hàng"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SizeChartDialog({
  imgUrl,
  productTitle,
}: {
  imgUrl: string;
  productTitle: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group -my-2 cursor-pointer py-2 text-[11px] font-bold tracking-[0.08em] uppercase opacity-60 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100"
        >
          <RollText label="Bảng size" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <div className="border-b border-border px-6 py-5 pr-14">
          <DialogTitle>Bảng size</DialogTitle>
        </div>
        <div className="p-4 sm:p-6">
          <img
            src={imgUrl}
            alt={`Bảng size ${productTitle}`}
            className="mx-auto h-auto w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
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
