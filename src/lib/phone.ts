/** Zambia-first phone entry. Keep the local leading zero in the field only. */
export const PHONE_COUNTRY_PREFIX = '+260';
export const PHONE_MAX_DIGITS = 10;
export const PHONE_EXAMPLE = '0961234567';
export const PHONE_HINT = `Enter 10 digits, e.g. ${PHONE_EXAMPLE}. We add +260 automatically.`;
export const PHONE_ERROR = `Enter a 10-digit number starting with 0, e.g. ${PHONE_EXAMPLE}.`;

export function localPhone(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Do not turn an arbitrary string containing letters into a payment number.
  if (/[^\d\s()+.-]/.test(value)) return '';
  let digits = value.replace(/\D/g, '');
  if (/^00260\d{9}$/.test(digits)) digits = `0${digits.slice(5)}`;
  else if (/^260\d{9}$/.test(digits)) digits = `0${digits.slice(3)}`;
  return digits.length <= PHONE_MAX_DIGITS ? digits : '';
}

export function validPhone(value: string): boolean {
  return /^0\d{9}$/.test(value);
}

/** Reject invalid numbers; never silently trim a payment destination. */
export function internationalPhone(value: string): string {
  const local = localPhone(value);
  if (!validPhone(local)) throw new Error(PHONE_ERROR);
  return `${PHONE_COUNTRY_PREFIX}${local.slice(1)}`;
}
