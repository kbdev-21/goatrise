import { useEffect, useRef } from "react";

/**
 * Ghi --s lên khối chồng thẻ: số thẻ đã bị đè tính theo tiến độ cuộn
 * (0 = thẻ đầu vừa dính, 1 = thẻ thứ hai vừa đè kín thẻ đầu...).
 * Mỗi thẻ (.stack-item) tự suy ra độ co / nghiêng / tối từ --s và --i
 * bằng calc() trong CSS.
 */
export function useStackProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // tắt hiệu ứng: CSS đã bỏ hết transform, khỏi theo dõi cuộn
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const first = el.querySelector<HTMLElement>(".stack-item");
      if (!first) return;
      const stickyTop = parseFloat(getComputedStyle(first).top) || 0;
      const { rowGap, paddingTop } = getComputedStyle(el);
      const gap = parseFloat(rowGap) || 0;
      // khoảng cuộn để thẻ sau đè kín thẻ trước
      const stride = first.offsetHeight + gap;
      // vị trí tự nhiên của thẻ đầu (thẻ dính không dùng offsetTop được vì nó đã bị dịch)
      const firstTop =
        el.getBoundingClientRect().top + (parseFloat(paddingTop) || 0);
      const progress = stride > 0 ? (stickyTop - firstTop) / stride : 0;
      el.style.setProperty("--s", Math.max(-1, progress).toFixed(4));
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return ref;
}
