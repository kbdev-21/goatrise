import namer from "color-namer";

// hex -> tên màu gần nhất theo bảng HTML (vd "#ff0000" -> "red").
// namer() throw khi chuỗi không phải màu hợp lệ; COLOR là free-text nên fallback về chính chuỗi đó.
export function getColorName(hex: string): string {
  try {
    return namer(hex).basic[0].name;
  } catch {
    return hex;
  }
}

export function capitalize(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

// format giá numeric (string|number) theo locale VN; null/rỗng -> "—"
export function formatPriceVn(price: string | number | null | undefined): string {
  if (price === null || price === undefined || price === "") return "—";
  return Number(price).toLocaleString("vi-VN");
}

// mirror backend core/utils.ts: lowercase + bỏ dấu tiếng Việt
export function normalizeVietnameseString(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}
