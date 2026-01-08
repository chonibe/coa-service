/**
 * Currency Converter Service
 * Real-time exchange rate fetching with caching
 */

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD"
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

interface ExchangeRates {
  base: string
  date: string
  rates: Record<string, number>
  timestamp: number
}

// In-memory cache for exchange rates
let cachedRates: ExchangeRates | null = null
let cacheExpires = 0

/**
 * Fetch exchange rates from API
 */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch(EXCHANGE_RATE_API, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      base: data.base || "USD",
      date: data.date || new Date().toISOString().split("T")[0],
      rates: data.rates || {},
      timestamp: Date.now(),
    }
  } catch (error: any) {
    console.error("Error fetching exchange rates:", error)
    // Return cached rates if available, or fallback rates
    if (cachedRates) {
      return cachedRates
    }
    // Fallback rates (approximate)
    return {
      base: "USD",
      date: new Date().toISOString().split("T")[0],
      rates: {
        USD: 1,
        GBP: 0.79,
        EUR: 0.92,
        CAD: 1.35,
        AUD: 1.52,
        ILS: 3.65,
        NIS: 3.65,
      },
      timestamp: Date.now(),
    }
  }
}

/**
 * Get current exchange rates (cached)
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  // Check if cache is valid
  if (cachedRates && Date.now() < cacheExpires) {
    return cachedRates
  }

  // Fetch new rates
  cachedRates = await fetchExchangeRates()
  cacheExpires = Date.now() + CACHE_TTL

  return cachedRates
}

/**
 * Convert amount from one currency to USD
 */
export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency.toUpperCase() === "USD") {
    return amount
  }

  const rates = await getExchangeRates()
  const rate = rates.rates[fromCurrency.toUpperCase()]

  if (!rate) {
    console.warn(`Exchange rate not found for ${fromCurrency}, using 1:1`)
    return amount
  }

  // Convert to USD (divide by rate since base is USD)
  return amount / rate
}

/**
 * Convert amount from USD to another currency
 */
export async function convertFromUSD(amount: number, toCurrency: string): Promise<number> {
  if (toCurrency.toUpperCase() === "USD") {
    return amount
  }

  const rates = await getExchangeRates()
  const rate = rates.rates[toCurrency.toUpperCase()]

  if (!rate) {
    console.warn(`Exchange rate not found for ${toCurrency}, using 1:1`)
    return amount
  }

  // Convert from USD (multiply by rate since base is USD)
  return amount * rate
}

/**
 * Convert amount between two currencies
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount
  }

  // Convert to USD first, then to target currency
  const usdAmount = await convertToUSD(amount, fromCurrency)
  return await convertFromUSD(usdAmount, toCurrency)
}

/**
 * Get exchange rate for a specific currency pair
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return 1
  }

  const rates = await getExchangeRates()
  const fromRate = rates.rates[fromCurrency.toUpperCase()] || 1
  const toRate = rates.rates[toCurrency.toUpperCase()] || 1

  // Calculate rate: fromCurrency -> USD -> toCurrency
  return toRate / fromRate
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD", "ILS", "NIS"] as const

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]







