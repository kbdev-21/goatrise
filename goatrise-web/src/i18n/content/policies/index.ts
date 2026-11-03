import type { Locale } from "@/i18n";

import { policiesEn } from "./en";
import { policiesVi } from "./vi";
import type { PolicyContent, PolicyId } from "./types";

const POLICIES: Record<Locale, Record<PolicyId, PolicyContent>> = {
  vi: policiesVi,
  en: policiesEn,
};

export const POLICY_LINKS = [
  { id: "returns", to: "/policies/returns" },
  { id: "payment", to: "/policies/payment" },
  { id: "warranty", to: "/policies/warranty" },
] as const;

export function getPolicyContent(locale: Locale, id: PolicyId): PolicyContent {
  return POLICIES[locale][id];
}
