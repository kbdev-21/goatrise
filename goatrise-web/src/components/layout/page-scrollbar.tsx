import { useEffect, useRef } from "react";

import { getLenis } from "@/hooks/use-smooth-scroll";

// khoảng hở trên / dưới của rãnh (khớp top-1 của thanh kéo) và cỡ tối thiểu của thanh kéo, px
const INSET = 4;
const MIN_THUMB = 40;

/**
 * Thanh cuộn của trang, thay cho thanh cuộn gốc (đã ẩn trong styles.css).
 *
 * Dải sát mép phải chỉ hiện thanh kéo khi rê chuột tới; kéo để cuộn, bấm vào
 * rãnh để cuộn tới đó. mix-blend-difference => thanh trắng tự hóa đen trên nền
 * sáng, nổi trên cả intro / hero tối. JS chỉ ghi --thumb-size / --thumb-y,
 * phần hiển thị do CSS lo. Thiết bị cảm ứng không có hover nên không hiện.
 */
export function PageScrollbar() {
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return;

    const root = document.documentElement;
    let frame = 0;
    let track = 0; // chiều dài rãnh
    let size = 0; // chiều dài thanh kéo
    let range = 0; // quãng cuộn tối đa
    // chỗ con trỏ nắm trên thanh kéo (tính từ đỉnh thanh); -1 = không kéo
    let grab = -1;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const content = root.scrollHeight;
      range = Math.max(0, content - viewport);
      track = viewport - INSET * 2;
      size = Math.min(track, Math.max(MIN_THUMB, (track * viewport) / content));
      const progress = range > 0 ? Math.min(1, window.scrollY / range) : 0;

      // trang không cuộn được thì không có gì để hiện
      rail.hidden = range <= 0;
      rail.style.setProperty("--thumb-size", `${size.toFixed(2)}px`);
      rail.style.setProperty(
        "--thumb-y",
        `${((track - size) * Math.max(0, progress)).toFixed(2)}px`
      );
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    // Lenis đang chạy thì cuộn qua nó, không thì nó kéo trang về đích cũ
    const scrollToY = (y: number, immediate: boolean) => {
      const top = Math.min(range, Math.max(0, y));
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(top, { immediate });
      } else {
        window.scrollTo({ top, behavior: immediate ? "instant" : "smooth" });
      }
    };

    // vị trí con trỏ -> scrollY, giữ nguyên chỗ đang nắm trên thanh kéo
    const toScrollY = (clientY: number, offset: number) =>
      track > size ? ((clientY - INSET - offset) / (track - size)) * range : 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // không bôi đen chữ lúc kéo
      event.preventDefault();

      if (event.target === thumb) {
        grab = event.clientY - thumb.getBoundingClientRect().top;
        rail.setPointerCapture(event.pointerId);
        rail.setAttribute("data-dragging", "");
      } else {
        // bấm vào rãnh: cuộn mượt tới chỗ đó, tâm thanh kéo về đúng con trỏ
        scrollToY(toScrollY(event.clientY, size / 2), false);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (grab < 0) return;
      scrollToY(toScrollY(event.clientY, grab), true);
    };

    // nhả chuột / mất capture (alt-tab...) đều kết thúc kéo
    const onDragEnd = () => {
      grab = -1;
      rail.removeAttribute("data-dragging");
    };

    // nội dung đổi cao (đổi trang, ảnh tải xong, intro trang chủ gập lại...)
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    rail.addEventListener("pointerdown", onPointerDown);
    rail.addEventListener("pointermove", onPointerMove);
    rail.addEventListener("lostpointercapture", onDragEnd);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      rail.removeEventListener("pointerdown", onPointerDown);
      rail.removeEventListener("pointermove", onPointerMove);
      rail.removeEventListener("lostpointercapture", onDragEnd);
    };
  }, []);

  return (
    // z-45: trên header (z-40), dưới lớp phủ của drawer / dialog (z-50)
    <div
      ref={railRef}
      aria-hidden
      className="group fixed inset-y-0 right-0 z-45 hidden w-3 mix-blend-difference pointer-fine:block"
    >
      <div
        ref={thumbRef}
        className="absolute top-1 right-[3px] h-(--thumb-size) w-1 translate-y-(--thumb-y) rounded-full bg-white/60 opacity-0 transition-[opacity,width,background-color] duration-300 ease-smooth group-hover:opacity-100 group-data-dragging:w-1.5 group-data-dragging:bg-white group-data-dragging:opacity-100 hover:w-1.5 hover:bg-white"
      />
    </div>
  );
}
