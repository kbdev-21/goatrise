import type { Locale } from "./config";

export type Currency = "VND" | "USD";

// tiền tệ đi theo ngôn ngữ: vi => VND, en => USD
export const CURRENCY: Record<Locale, Currency> = {
  vi: "VND",
  en: "USD",
};

// Giá trong hệ thống luôn là VND; USD chỉ là giá quy đổi để hiển thị, đơn hàng vẫn thanh toán bằng VND.
// Tỷ giá cấu hình qua VITE_VND_PER_USD, thiếu / sai thì dùng giá trị mặc định
const ENV_RATE = Number(import.meta.env.VITE_VND_PER_USD);
export const VND_PER_USD = ENV_RATE > 0 ? ENV_RATE : 26_000;

const VND_FORMAT = new Intl.NumberFormat("vi-VN");
const USD_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// valueVnd: số tiền VND (đúng như backend trả về)
export function formatPrice(valueVnd: number, locale: Locale): string {
  if (CURRENCY[locale] === "USD") {
    return USD_FORMAT.format(valueVnd / VND_PER_USD);
  }
  return `${VND_FORMAT.format(valueVnd)} đ`;
}
