import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const formatCurrency = (amount: string | number, currency = "USD") => {
  const currencyMap: Record<string, string> = {
    USD: "en-US",
    GBP: "en-GB",
    EUR: "de-DE",
    CAD: "en-CA",
    AUD: "en-AU",
    JPY: "ja-JP",
  }

  const locale = currencyMap[currency] || "en-US"

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(Number(amount))
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
