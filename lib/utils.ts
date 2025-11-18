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

/**
 * Converts GBP amount to USD
 * @param gbpAmount Amount in GBP
 * @returns Amount in USD
 */
export function convertGBPToUSD(gbpAmount: number): number {
  return gbpAmount * GBP_TO_USD_RATE
}

/**
 * Formats amount as USD currency
 * @param amount Amount in USD
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatUSD(amount: number): string {
  return formatCurrency(amount, 'USD')
}
