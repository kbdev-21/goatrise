import { useEffect, useRef } from "react";

type Options = {
  /** Phần tử phải lọt vào viewport bao nhiêu thì tính là "đã tới" */
  threshold?: number;
  rootMargin?: string;
};

/**
 * Gắn ref vào phần tử bao ngoài; mọi con mang [data-reveal] sẽ được bật
 * data-inview="true" khi cuộn tới. Hiệu ứng nằm hết trong CSS, hook chỉ
 * bật cờ nên không có animation chạy bằng JS.
 */
export function useReveal<T extends HTMLElement>({
  threshold = 0.15,
  rootMargin = "0px 0px -8% 0px",
}: Options = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = [
      ...(root.hasAttribute("data-reveal") ? [root] : []),
      ...root.querySelectorAll<HTMLElement>("[data-reveal]"),
    ];
    if (targets.length === 0) return;

    // Người dùng tắt hiệu ứng: hiện thẳng, không quan sát gì cả
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.setAttribute("data-inview", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.setAttribute("data-inview", "true");
          // chỉ chạy một lần, cuộn ngược lên không reset
          observer.unobserve(entry.target);
        });
      },
      { threshold, rootMargin }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
