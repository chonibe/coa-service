/**
 * Country list for address forms and dropdowns.
 * Shop shipping aligns with {@link STORE_SHIP_TO_COUNTRIES} in `lib/shopify/shipping-zone-country-codes.ts`.
 */

import { STORE_SHIP_TO_COUNTRIES } from '@/lib/shopify/shipping-zone-country-codes'

export interface CountryOption {
  code: string
  name: string
}

export const COUNTRY_OPTIONS: CountryOption[] = [...STORE_SHIP_TO_COUNTRIES]

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
  IN: '+91',
  CN: '+86',
  UA: '+380',
  RU: '+7',
  TW: '+886',
  TH: '+66',
  MY: '+60',
  VN: '+84',
  PL: '+48',
  PT: '+351',
  GR: '+30',
  SE: '+46',
  NO: '+47',
  DK: '+45',
  FI: '+358',
  IE: '+353',
  AT: '+43',
  CH: '+41',
  BE: '+32',
  CZ: '+420',
  HU: '+36',
  RO: '+40',
  BG: '+359',
  HR: '+385',
  SK: '+421',
  SI: '+386',
  LT: '+370',
  LV: '+371',
  EE: '+372',
  LU: '+352',
  CY: '+357',
  MT: '+356',
  NZ: '+64',
  SG: '+65',
  HK: '+852',
  AE: '+971',
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
  { dial: '+91', label: '+91' },
  { dial: '+86', label: '+86' },
  { dial: '+380', label: '+380' },
  { dial: '+7', label: '+7' },
  { dial: '+886', label: '+886' },
  { dial: '+66', label: '+66' },
  { dial: '+60', label: '+60' },
  { dial: '+84', label: '+84' },
]

export function getPhoneCodeForCountry(countryCode: string): string {
  return COUNTRY_PHONE_CODES[countryCode] ?? '+1'
}

/** Map dial code → country code (for inferring country from autofilled phone) */
export const PHONE_CODE_TO_COUNTRY: Record<string, string> = {
  '+1': 'US',
  '+44': 'GB',
  '+61': 'AU',
  '+49': 'DE',
  '+33': 'FR',
  '+39': 'IT',
  '+34': 'ES',
  '+31': 'NL',
  '+972': 'IL',
  '+81': 'JP',
  '+82': 'KR',
  '+52': 'MX',
  '+91': 'IN',
  '+86': 'CN',
  '+380': 'UA',
  '+7': 'RU',
  '+886': 'TW',
  '+66': 'TH',
  '+60': 'MY',
  '+84': 'VN',
}
