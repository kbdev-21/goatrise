import type { Locale } from "@/i18n";

import { policiesEn } from "./en";
import { policiesVi } from "./vi";
import type { PolicyContent } from "./types";

const POLICIES: Record<Locale, PolicyContent> = {
  vi: policiesVi,
  en: policiesEn,
};

export function getPolicyContent(locale: Locale): PolicyContent {
  return POLICIES[locale];
}
