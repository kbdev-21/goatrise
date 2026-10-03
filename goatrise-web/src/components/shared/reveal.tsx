import type { CSSProperties, ReactNode } from "react";

import { useReveal } from "@/hooks/use-reveal";

/**
 * Một phần tử tự hiện dần khi cuộn tới, tự quan sát chính nó. Dùng cho lưới
 * có phần tử thay đổi sau khi mount (lọc, sắp xếp...): useReveal ở khối cha
 * chỉ quét [data-reveal] một lần nên thẻ mới chen vào sẽ bị ẩn mãi.
 */
export function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-reveal
      className={className}
      style={
        delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}
