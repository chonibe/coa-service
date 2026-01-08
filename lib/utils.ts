import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(dateObj);
}

// Currency conversion: GBP to USD
// Using a conservative exchange rate (can be updated or made dynamic)
const GBP_TO_USD_RATE = 1.27

// Currency conversion: NIS (ILS) to USD
// Using a conservative exchange rate (can be updated or made dynamic)
const NIS_TO_USD_RATE = 0.27

/**
 * Converts GBP amount to USD
 * @param gbpAmount Amount in GBP
 * @returns Amount in USD
 */
export function convertGBPToUSD(gbpAmount: number): number {
  return gbpAmount * GBP_TO_USD_RATE
}

/**
 * Converts NIS (ILS) amount to USD
 * @param nisAmount Amount in NIS/ILS
 * @returns Amount in USD
 */
export function convertNISToUSD(nisAmount: number): number {
  return nisAmount * NIS_TO_USD_RATE
}

/**
 * Formats amount as USD currency
 * @param amount Amount in USD
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatUSD(amount: number): string {
  return formatCurrency(amount, 'USD')
}

/**
 * Formats file size in bytes to human-readable format
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "500 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
