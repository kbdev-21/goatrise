import type { User } from "../module/auth/domain/types.js";

export type ContextVariables = {
  currentUser: User
}

export type LanguageString = {
  vi: string,
  en: string
}

export type Address = {
  countryCode: string,
  provinceCode: string | null,
  provinceName: string,
  address: string
}

// kênh bán/nguồn dùng chung cho order.channel và customer.source
export type SalesChannel =
  | "WEBSITE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TIKTOK"
  | "ZALO"
  | "SHOPEE"
  | "REFERRAL"
  | "OTHER";