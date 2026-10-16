const VERSION = 1;
export const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const FIELD_NAMES = ['business_type', 'email', 'full_name', 'phone', 'legal_name', 'trading_name', 'registration_number', 'tax_id', 'country_code', 'store_name', 'store_slug', 'store_ussd_code', 'store_currency', 'store_category', 'store_description'] as const;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type OnboardingDraft = { version: number; savedAt: number; step: string; fields: Record<string, string>; hasDocuments: boolean };

export function onboardingDraftKey(mode: string, userId?: string): string {
  return `geepay:onboarding-draft:v1:${mode}:${userId || 'guest'}`;
}

export function safeDraftFields(form: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const key of FIELD_NAMES) if (typeof form[key] === 'string' && form[key].length <= 2000) fields[key] = form[key];
  return fields;
}

export function readOnboardingDraft(storage: DraftStorage, key: string, now = Date.now()): OnboardingDraft | null {
  try {
    const raw = storage.getItem(key);
    if (!raw || raw.length > 40000) return null;
    const draft = JSON.parse(raw);
    if (draft?.version !== VERSION || !Number.isFinite(draft.savedAt) || draft.savedAt > now || now - draft.savedAt > DRAFT_TTL_MS
      || typeof draft.step !== 'string' || !draft.fields || typeof draft.fields !== 'object' || Array.isArray(draft.fields)) {
      storage.removeItem(key); return null;
    }
    return { version: VERSION, savedAt: draft.savedAt, step: draft.step.slice(0, 32), fields: safeDraftFields(draft.fields), hasDocuments: draft.hasDocuments === true };
  } catch { return null; }
}

export function saveOnboardingDraft(storage: DraftStorage, key: string, form: Record<string, unknown>, step: string, hasDocuments: boolean): boolean {
  try {
    storage.setItem(key, JSON.stringify({ version: VERSION, savedAt: Date.now(), step, fields: safeDraftFields(form), hasDocuments }));
    return true;
  } catch { return false; }
}

export function clearOnboardingDraft(storage: DraftStorage, key: string): boolean {
  try { storage.removeItem(key); return true; } catch { return false; }
}
