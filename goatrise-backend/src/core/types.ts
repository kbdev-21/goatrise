import type { User } from "../module/users/domain/types.js";

export type ContextVariables = {
  currentUser: User
}

export type LanguageString = {
  vi: string,
  en: string
}