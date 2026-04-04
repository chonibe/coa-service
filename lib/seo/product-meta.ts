import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

const BRAND = 'Street Collector'
const MAX_TITLE = 60
const MAX_DESC = 160

function truncate(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

export function buildProductTitle(product: ShopifyProduct): string {
  const vendor = product.vendor?.trim()
  const title = product.title?.trim() || 'Art print'
  const base = vendor ? `${title} by ${vendor} | ${BRAND}` : `${title} | ${BRAND}`
  return truncate(base, MAX_TITLE)
}

/** GEO: citable one-paragraph answer under the H1. */
export function buildProductAnswerFirst(product: ShopifyProduct): string {
  const t = product.title?.trim() || 'This artwork'
  const v = product.vendor?.trim()
  if (v) {
    return `${t} is a limited edition street art print by ${v} on Street Collector: small runs, Certificate of Authenticity, and shipping worldwide. Display it in the Street Collector lamp or frame it like a traditional print.`
  }
  return `${t} is a limited edition street art print on Street Collector with Certificate of Authenticity and worldwide shipping.`
}

export function buildProductDescription(product: ShopifyProduct): string {
  const title = product.title?.trim() || 'Limited edition print'
  const vendor = product.vendor?.trim()
  const tail = `Limited edition street art print on ${BRAND}. Certificate of Authenticity. Ships worldwide.`
  const lead = vendor ? `${title} by ${vendor}.` : `${title}.`
  return truncate(`${lead} ${tail}`, MAX_DESC)
}
