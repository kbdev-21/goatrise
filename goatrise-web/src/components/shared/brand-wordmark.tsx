import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Cách hiện chữ GOAT RISE ở các vị trí logo (header, menu mobile, intro, trang tài khoản).
 * "image": file logo trong /public; "font": gõ chữ bằng font-logo (Afacad) như cũ.
 */
export const WORDMARK_MODE: "image" | "font" = "image";

// Dùng file logo làm mặt nạ, tô bằng màu chữ hiện tại (bg-current) => tự đổi
// trắng / đen theo header mà không cần đổi file. Bản trắng
// (/goatrise-wordmark-white.webp) để dành cho chỗ cần dùng thẳng thẻ <img>
const MASK_STYLE = {
  maskImage: "url(/goatrise-wordmark-black.webp)",
  WebkitMaskImage: "url(/goatrise-wordmark-black.webp)",
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
} satisfies CSSProperties;

/**
 * Logo chữ GOAT RISE, cỡ theo font-size của phần tử cha (hoặc className).
 * Bản ảnh cao 0.58em = chiều cao chữ hoa Afacad => đổi qua lại giữa hai chế độ
 * không lệch bố cục, intro trang chủ (đo theo font-size) và chỗ dê đáp vẫn khớp.
 */
export function BrandWordmark({ className }: { className?: string }) {
  if (WORDMARK_MODE === "font") {
    return (
      <span className={cn("font-logo font-extrabold uppercase", className)}>
        GOAT RISE
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="GOAT RISE"
      // tỉ lệ đúng bằng file đã cắt sát chữ (1443 x 219)
      className={cn("block aspect-[1443/219] h-[0.58em] bg-current", className)}
      style={MASK_STYLE}
    />
  );
}
