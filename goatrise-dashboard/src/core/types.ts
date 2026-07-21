export type LanguageString = {
  vi: string;
  en: string;
};

export type Address = {
  countryCode: string;
  provinceCode: string | null;
  provinceName: string;
  address: string;
};

// Mirror backend: core/types.ts -> SalesChannel (dùng chung cho order.channel & customer.source)
export type SalesChannel =
  | "WEBSITE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TIKTOK"
  | "ZALO"
  | "SHOPEE"
  | "REFERRAL"
  | "OTHER";
