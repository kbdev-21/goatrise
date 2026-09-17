import { useEffect } from "react";
import Lenis from "lenis";

const OPTIONS = {
  // thời gian con trỏ cuộn đuổi kịp vị trí đích — càng lớn càng trễ
  duration: 0.8,
  // easeOutExpo: bung gần hết quãng đường ngay lúc đầu rồi rê rất dài về đích
  easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  // mỗi nấc lăn đi xa hơn cuộn thường, bù lại cho duration ngắn
  wheelMultiplier: 1.2,
  // trên mobile giữ cuộn native, quán tính của hệ điều hành đã đủ tốt
  syncTouch: false,
};

/**
 * Cuộn có quán tính (smooth / lerp scroll) như các site tham chiếu.
 *
 * Lenis không dịch chuyển nội dung bằng transform mà vẫn gọi window.scrollTo,
 * nên window.scrollY, position: sticky/fixed và mọi hook đang đọc
 * getBoundingClientRect (useScrollProgress, header ẩn/hiện) chạy nguyên si.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis(OPTIONS);

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    // Radix (cart drawer, mobile menu) khóa cuộn bằng data-scroll-locked trên
    // body; Lenis phải dừng theo, không thì nền vẫn trôi sau lớp phủ
    const syncLock = () => {
      if (document.body.hasAttribute("data-scroll-locked")) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });
    syncLock();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      lenis.destroy();
    };
  }, []);
}
