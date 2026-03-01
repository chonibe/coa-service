/**
 * Country list for address forms and dropdowns
 * Curated list of common shipping countries (Stripe Checkout allowed countries)
 */

export interface CountryOption {
  code: string
  name: string
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LV', name: 'Latvia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IL', name: 'Israel' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
]

export const COUNTRY_PHONE_CODES: Record<string, string> = {
  US: '+1',
  CA: '+1',
  GB: '+44',
  AU: '+61',
  DE: '+49',
  FR: '+33',
  IT: '+39',
  ES: '+34',
  NL: '+31',
  IL: '+972',
  JP: '+81',
  KR: '+82',
  MX: '+52',
  BR: '+55',
  IN: '+91',
  CN: '+86',
}

/** Unique dial codes for phone country selector */
export const PHONE_DIAL_OPTIONS = [
  { dial: '+1', label: '+1' },
  { dial: '+44', label: '+44' },
  { dial: '+61', label: '+61' },
  { dial: '+49', label: '+49' },
  { dial: '+33', label: '+33' },
  { dial: '+39', label: '+39' },
  { dial: '+34', label: '+34' },
  { dial: '+31', label: '+31' },
  { dial: '+972', label: '+972' },
  { dial: '+81', label: '+81' },
  { dial: '+82', label: '+82' },
  { dial: '+52', label: '+52' },
  { dial: '+55', label: '+55' },
  { dial: '+91', label: '+91' },
  { dial: '+86', label: '+86' },
]

export function getPhoneCodeForCountry(countryCode: string): string {
  return COUNTRY_PHONE_CODES[countryCode] ?? '+1'
}
