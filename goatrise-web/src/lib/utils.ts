import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import namer from "color-namer"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// hex -> tên màu gần nhất theo bảng HTML (vd "#ff0000" -> "red").
// namer() throw khi chuỗi không phải màu hợp lệ; COLOR là free-text nên fallback về chính chuỗi đó.
export function getColorName(hex: string): string {
  try {
    return namer(hex).basic[0].name
  } catch {
    return hex
  }
}

// bỏ dấu + viết thường để tìm kiếm: gõ "da nang" vẫn ra "Đà Nẵng"
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

// Định dạng giá đã chuyển sang i18n/currency (VND / USD theo ngôn ngữ): dùng useFormatPrice()
