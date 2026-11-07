import type { CartLine } from "./cart";
import type { Locale } from "./i18n";
import type {
  contactModes,
  requestPurposes,
  timeWindows,
} from "./request-copy";
export type RequestDraft = {
  lines: CartLine[];
  services: string[];
  purpose: keyof typeof requestPurposes;
  mode: keyof typeof contactModes;
  date: string;
  time: keyof typeof timeWindows;
  alternative: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  custom: boolean;
  customDescription: string;
  position: number;
};
// One-use, short-lived memory handoff for a client-side language change only.
// Customer fields never enter URLs, localStorage, sessionStorage, or cookies.
let handoff: {
  key: string;
  locale: Locale;
  draft: RequestDraft;
  expires: number;
} | null = null;
const revisions: Record<Locale, number> = { en: 0, bn: 0 };
const listeners = new Set<() => void>();
export function subscribeLanguageDraft(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function languageDraftRevision(locale: Locale) {
  return revisions[locale];
}
export function keepDraftForLanguage(
  key: string,
  draft: RequestDraft,
  locale: Locale,
) {
  handoff = { key, locale, draft, expires: Date.now() + 30000 };
  // A restored Activity must mount a fresh form from the new handoff, rather
  // than revive stale fields from the last time this locale was visible.
  revisions[locale] += 1;
  listeners.forEach((listener) => listener());
  setTimeout(() => {
    if (handoff && handoff.expires <= Date.now()) handoff = null;
  }, 30000);
}
export function consumeLanguageDraft(key: string, locale: Locale) {
  const pending = handoff;
  return pending &&
    pending.key === key &&
    pending.locale === locale &&
    pending.expires > Date.now()
    ? pending.draft
    : null;
}
export function clearLanguageDraft(draft: RequestDraft) {
  if (handoff?.draft === draft) handoff = null;
}
