import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import Lenis from "lenis";

const OPTIONS = {
  // thời gian con trỏ cuộn đuổi kịp vị trí đích — càng lớn càng trễ
  duration: 0.75,
  // easeOutExpo: bung gần hết quãng đường ngay lúc đầu rồi rê rất dài về đích
  easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  // mỗi nấc lăn đi xa hơn cuộn thường, bù lại cho duration ngắn
  wheelMultiplier: 1,
  // trên mobile giữ cuộn native, quán tính của hệ điều hành đã đủ tốt
  syncTouch: false,
};

let current: Lenis | null = null;

/** Lenis đang chạy (null nếu tắt hiệu ứng): code tự đổi vị trí cuộn phải đồng bộ lại cho nó */
export const getLenis = () => current;

/**
 * Cuộn có quán tính (smooth / lerp scroll) như các site tham chiếu.
 *
 * Lenis không dịch chuyển nội dung bằng transform mà vẫn gọi window.scrollTo,
 * nên window.scrollY, position: sticky/fixed và mọi hook đang đọc
 * getBoundingClientRect (useScrollProgress, header ẩn/hiện) chạy nguyên si.
 */
export function useSmoothScroll() {
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis(OPTIONS);
    current = lenis;

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

    // Router về đầu trang bằng window.scrollTo lúc trang mới render xong. Nhưng Lenis đang trôi dở (lăn
    // chuột rồi bấm link ngay) thì bỏ qua sự kiện cuộn đó và kéo tiếp về đích
    // cũ => trang mới nằm đúng mức cuộn của trang trước. Ghim Lenis về đúng chỗ
    // đang đứng (immediate: bỏ quán tính; force: kể cả lúc drawer đang khóa)
    const syncToNative = () =>
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });

    // bấm link: cắt quán tính ngay, trang cũ không trôi tiếp trong lúc tải
    const unsubscribeNavigate = router.subscribe(
      "onBeforeNavigate",
      syncToNative
    );
    // trang mới render: đồng bộ theo vị trí router vừa đặt. Đợi microtask để
    // chắc chắn subscriber cuộn của router chạy xong trước, không phụ thuộc
    // thứ tự đăng ký
    const unsubscribeRendered = router.subscribe("onRendered", () =>
      queueMicrotask(syncToNative)
    );

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribeNavigate();
      unsubscribeRendered();
      lenis.destroy();
      current = null;
    };
  }, [router]);
}
