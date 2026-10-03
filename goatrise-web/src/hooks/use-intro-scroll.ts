import { useEffect, useRef } from "react";

import { getLenis } from "@/hooks/use-smooth-scroll";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// quãng cuộn (tính bằng màn hình) cho pha dê bay ra, sau khi dải dừng;
// đổi thì chỉnh cả height của .intro-section
const FLY_SCREENS = 0.5;

// đã qua intro bao lâu không cuộn thì gập intro lại. Chờ dừng tay vì đổi vị trí
// cuộn giữa chừng sẽ cắt mất quán tính (Lenis / momentum của mobile)
const COLLAPSE_IDLE_MS = 200;

// Intro chỉ chạy một lần mỗi lần tải trang: qua hết rồi thì gập lại, quay lại
// trang chủ trong SPA cũng không hiện nữa, F5 mới có lại. Chỉ bật ở client nên
// SSR / lần hydrate đầu luôn render intro đầy đủ
let introDone = false;

export const isIntroDone = () => introDone;

let measureContext: CanvasRenderingContext2D | null = null;

/** Bề ngang dấu cách (tính bằng em) của font đang dùng trên phần tử */
const spaceWidthEm = (el: HTMLElement) => {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext) return null;
  const style = getComputedStyle(el);
  const size = parseFloat(style.fontSize);
  measureContext.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
  // đo cả cụm để tính luôn kerning quanh dấu cách
  const space =
    measureContext.measureText("GOAT RISE").width -
    measureContext.measureText("GOATRISE").width;
  return size > 0 ? space / size : null;
};

/**
 * Tiến độ cuộn của màn mở đầu trang chủ (section ghim, bên trong trượt ngang).
 *
 * Gắn ref vào section; bên trong cần [data-intro-stage] (khung dính 1 màn hình)
 * và [data-intro-track] (dải nằm ngang). Section cao = quãng trượt ngang
 * + FLY_SCREENS + 2 màn hình (màn chuyển sang hero + màn ghim).
 *
 * Ghi lên section:
 *   --h  tiến độ trượt ngang 0 → 1
 *   --f  tiến độ pha sau khi dải dừng (dê bay ra) 0 → 1
 *   --c  tiến độ chuyển sang hero 0 → 1
 *   --x  độ dịch hiện tại của dải (số px, âm dần)
 *   --wm-dx, --wm-dy, --wm-s, --wm-gap
 *        đích bay của [data-intro-wordmark]: độ dời tâm (px) tới tâm logo header
 *        [data-header-logo], tỉ lệ cỡ chữ, bề ngang dấu cách của logo (em)
 * và lên mỗi [data-intro-letter]:
 *   --d  vị trí tâm chữ trên màn hình, tính bằng bề ngang màn hình
 *        (0 = mép trái, 1 = mép phải)
 *
 * Cuộn qua hết intro rồi dừng tay thì gắn [data-intro-done] lên section (CSS
 * gập lại chỉ còn hero) và bù vị trí cuộn => cuộn ngược lên không gặp lại intro.
 */
export function useIntroScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const section = ref.current;
    const stage = section?.querySelector<HTMLElement>("[data-intro-stage]");
    const track = section?.querySelector<HTMLElement>("[data-intro-track]");
    if (!section || !stage || !track || introDone) return;
    // tắt hiệu ứng: CSS bỏ ghim, khỏi theo dõi cuộn
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let travel = 0;
    let letters: Array<{ el: HTMLElement; center: number }> = [];
    let frame = 0;
    let idleTimer = 0;
    let visible = true;

    const update = () => {
      frame = 0;
      const scrolled = -section.getBoundingClientRect().top;
      const screen = stage.offsetHeight;
      const fly = screen * FLY_SCREENS;
      const slide = section.offsetHeight - screen * 2 - fly;
      const h = slide > 0 ? clamp01(scrolled / slide) : 0;
      const f = fly > 0 ? clamp01((scrolled - slide) / fly) : 0;
      const c = screen > 0 ? clamp01((scrolled - slide - fly) / screen) : 0;
      const x = -h * travel;
      const width = stage.clientWidth;

      section.style.setProperty("--h", h.toFixed(4));
      section.style.setProperty("--f", f.toFixed(4));
      section.style.setProperty("--c", c.toFixed(4));
      section.style.setProperty("--x", x.toFixed(2));

      letters.forEach(({ el, center }) => {
        const d = width > 0 ? (center + x) / width : 0;
        el.style.setProperty("--d", d.toFixed(4));
      });
    };

    const measure = () => {
      travel = Math.max(0, track.scrollWidth - stage.clientWidth);
      // hiệu hai rect cùng chịu transform của dải => ra vị trí gốc trong dải
      const trackLeft = track.getBoundingClientRect().left;
      letters = [
        ...track.querySelectorAll<HTMLElement>("[data-intro-letter]"),
      ].map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, center: rect.left + rect.width / 2 - trackLeft };
      });
      measureHandoff(trackLeft);
      update();
    };

    // GOAT RISE bay lên thay chỗ logo header: đo từ logo thật để khớp mọi cỡ màn hình
    const measureHandoff = (trackLeft: number) => {
      const wordmark = track.querySelector<HTMLElement>(
        "[data-intro-wordmark]"
      );
      const panel = wordmark?.parentElement;
      const logo = document.querySelector<HTMLElement>("[data-header-logo]");
      const header = logo?.closest("header");
      if (!wordmark || !panel || !logo || !header) return;

      // tâm GOAT RISE lúc dải dừng (h = 1) = tâm tấm cuối sau khi dải dịch hết quãng
      // (đo tấm chứa vì chính nó đổi bề ngang và bị transform trong lúc bay)
      const panelRect = panel.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const fromX = panelRect.left - trackLeft - travel + panelRect.width / 2;
      const fromY = panelRect.top - stageRect.top + panelRect.height / 2;

      // header có thể đang bị dịch lên (translate): lấy vị trí logo trong header
      const logoRect = logo.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      const toX = logoRect.left + logoRect.width / 2;
      const toY = logoRect.top - headerRect.top + logoRect.height / 2;

      const wordSize = parseFloat(getComputedStyle(wordmark).fontSize);
      const logoSize = parseFloat(getComputedStyle(logo).fontSize);
      const gap = spaceWidthEm(logo);

      section.style.setProperty("--wm-dx", (toX - fromX).toFixed(2));
      section.style.setProperty("--wm-dy", (toY - fromY).toFixed(2));
      if (wordSize > 0) {
        section.style.setProperty("--wm-s", (logoSize / wordSize).toFixed(5));
      }
      if (gap !== null) section.style.setProperty("--wm-gap", gap.toFixed(4));
    };

    const collapse = () => {
      idleTimer = 0;
      // còn ghim (chưa nhả, hoặc đã cuộn ngược vào lại) thì chưa gập
      const before = section.getBoundingClientRect().bottom;
      if (before > stage.offsetHeight + 1) return;

      // tự bù vị trí bên dưới; tắt scroll anchoring để trình duyệt không bù chồng lên
      const root = document.documentElement;
      root.style.overflowAnchor = "none";
      section.setAttribute("data-intro-done", "");
      introDone = true;

      // giữ đáy section (đáy hero) đứng yên trên màn hình => không thấy giật
      const after = section.getBoundingClientRect().bottom;
      window.scrollTo({
        top: window.scrollY + after - before,
        behavior: "instant",
      });
      const lenis = getLenis();
      lenis?.resize();
      lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
      root.style.overflowAnchor = "";

      teardown();
    };

    const schedule = () => {
      if (frame === 0 && visible) frame = requestAnimationFrame(update);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(collapse, COLLAPSE_IDLE_MS);
    };

    // Ngoài tầm nhìn thì ngừng tính
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: "20% 0px" }
    );

    // font tải xong làm chữ rộng ra => dải dài thêm, phải đo lại
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    resizeObserver.observe(stage);

    observer.observe(section);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    // trang mở ra đã nằm sau intro (vd. link có #hash) => gập luôn
    idleTimer = window.setTimeout(collapse, COLLAPSE_IDLE_MS);

    function teardown() {
      cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", schedule);
    }

    return teardown;
  }, []);

  return ref;
}
