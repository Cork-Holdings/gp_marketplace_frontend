import { COUNTRY_OPTIONS, CURRENCY_OPTIONS, DEFAULT_COUNTRY_CODE, DEFAULT_CURRENCY } from '@/lib/locale';

export const BUSINESS_TYPES = {
  formal: {
    id: 'formal',
    label: 'Formal Business',
    description: 'Registered company with incorporation documents and tax ID.',
    icon: '🏢',
  },
  informal: {
    id: 'informal',
    label: 'Informal / Sole Trader',
    description: 'Individual trader, barbershop, or market vendor without full incorporation.',
    icon: '🏪',
  },
};

export { COUNTRY_OPTIONS, CURRENCY_OPTIONS };

export const ADMIN_ROLES = [
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Support' },
  { value: 'viewer', label: 'Viewer' },
];

export const STORE_CATEGORIES = [
  { value: 'ON_PREMISE_SERVICE', label: 'On-Premise Service (Barber, Salon)' },
  { value: 'FOOD_BEVERAGE', label: 'Food & Beverage' },
  { value: 'PHYSICAL_GOODS', label: 'Physical Goods (Boutique)' },
  { value: 'ON_SITE_SERVICE', label: 'On-Site Service (Plumber, Electrician)' },
];

export const INITIAL_MERCHANT_FORM = {
  business_type: 'informal',
  email: '',
  password: '',
  full_name: '',
  phone: '',
  legal_name: '',
  trading_name: '',
  registration_number: '',
  tax_id: '',
  country_code: DEFAULT_COUNTRY_CODE,
  store_name: '',
  store_slug: '',
  store_ussd_code: '252',
  store_currency: DEFAULT_CURRENCY,
  store_category: 'ON_PREMISE_SERVICE',
  store_description: '',
};

export const USER_FILE_FIELDS = [
  { key: 'national_id', label: 'National ID', hint: 'PDF, JPG or PNG' },
  { key: 'passport', label: 'Passport (optional)', hint: 'PDF, JPG or PNG', optional: true },
  { key: 'selfie', label: 'Selfie verification', hint: 'Clear photo of your face' },
];

export const KYC_FILE_FIELDS = [
  { key: 'company_registration', label: 'Company registration', formalOnly: true },
  { key: 'owner_id', label: 'Owner ID verification', hint: 'KYC owner identity document' },
  { key: 'structural_approval', label: 'Structural / trade approval', optional: true },
];

export function getSelfRegisterSteps(_businessType?: string) {
  return [
    { id: 'type', label: 'Business type' },
    { id: 'profile', label: 'Your profile' },
    { id: 'business', label: 'Business details' },
    { id: 'identity', label: 'Identity documents' },
    { id: 'kyc', label: 'Business verification' },
    { id: 'review', label: 'Review & submit' },
  ];
}

export function getAdminOnboardSteps() {
  return [
    { id: 'type', label: 'Business type' },
    { id: 'profile', label: 'Administrator' },
    { id: 'business', label: 'Business details' },
    { id: 'identity', label: 'Identity documents' },
    { id: 'kyc', label: 'KYC documents' },
    { id: 'store', label: 'First store' },
    { id: 'review', label: 'Review & create' },
  ];
}

export function getAdditionalBusinessSteps() {
  return [
    { id: 'type', label: 'Business type' },
    { id: 'business', label: 'Business details' },
    { id: 'kyc', label: 'Verification documents' },
    { id: 'review', label: 'Submit' },
  ];
}
