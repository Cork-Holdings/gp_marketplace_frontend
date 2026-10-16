/** Primary marketplace locale — Zambia. */
export const DEFAULT_COUNTRY_CODE = 'ZM';
export const DEFAULT_COUNTRY_LABEL = 'Zambia';
export const DEFAULT_CURRENCY = 'ZMW';
export const DEFAULT_PHONE_PLACEHOLDER = 'e.g. 0961234567';
export const DEFAULT_LOCALE = 'en-ZM';

export const COUNTRY_OPTIONS = [
  { code: 'ZM', label: 'Zambia' },
  { code: 'KE', label: 'Kenya' },
  { code: 'UG', label: 'Uganda' },
  { code: 'TZ', label: 'Tanzania' },
  { code: 'RW', label: 'Rwanda' },
];

export const CURRENCY_OPTIONS = [
  { value: 'ZMW', label: 'ZMW — Zambian Kwacha' },
  { value: 'KES', label: 'KES — Kenya Shilling' },
  { value: 'UGX', label: 'UGX — Uganda Shilling' },
  { value: 'TZS', label: 'TZS — Tanzania Shilling' },
];

export function formatLocaleNumber(amount, options = {}) {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString(DEFAULT_LOCALE, options);
}
