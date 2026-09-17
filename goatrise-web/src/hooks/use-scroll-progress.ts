import { useEffect, useRef } from "react";

type Options = {
  /** Mốc bắt đầu tính, theo quãng phần tử đi qua viewport (0 = vừa chạm đáy) */
  start?: number;
  /** Mốc kết thúc (1 = mép dưới vừa vượt khỏi đỉnh viewport) */
  end?: number;
  /** Tên CSS variable nhận giá trị 0 → 1 */
  varName?: string;
  /** Giá trị dùng khi người dùng tắt hiệu ứng chuyển động */
  reducedValue?: number;
};

/**
 * Ghi tiến độ cuộn của một phần tử (0 → 1) vào CSS variable trên chính nó.
 * Con cháu thừa kế biến này nên toàn bộ parallax / fade viết bằng calc() trong
 * CSS, JS chỉ cập nhật một con số mỗi frame.
 */
export function useScrollProgress<T extends HTMLElement>({
  start = 0,
  end = 1,
  varName = "--p",
  reducedValue = 0,
}: Options = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty(varName, String(reducedValue));
      return;
    }

    let frame = 0;
    let visible = true;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const travel = window.innerHeight + rect.height;
      const raw = travel === 0 ? 0 : (window.innerHeight - rect.top) / travel;
      const progress = (raw - start) / (end - start);
      el.style.setProperty(
        varName,
        Math.min(1, Math.max(0, progress)).toFixed(4)
      );
    };

    const schedule = () => {
      if (frame === 0 && visible) frame = requestAnimationFrame(update);
    };

    // Ngoài tầm nhìn thì ngừng tính, khỏi tốn frame
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: "20% 0px" }
    );

    observer.observe(el);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [start, end, varName, reducedValue]);

  return ref;
}
