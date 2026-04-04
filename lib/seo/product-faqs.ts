import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

export type FaqPair = { question: string; answer: string }

export function buildProductFaqPairs(product: ShopifyProduct): FaqPair[] {
  const title = product.title
  const v = product.vendor?.trim()
  return [
    {
      question: `What is ${title}?`,
      answer: v
        ? `${title} is a limited edition street art print by ${v}, available on Street Collector with a Certificate of Authenticity.`
        : `${title} is a limited edition street art print on Street Collector with a Certificate of Authenticity.`,
    },
    {
      question: 'How many editions of each artwork are there?',
      answer:
        'Edition sizes are listed on each product page. Street Collector focuses on small limited runs; see the edition details on this page.',
    },
    {
      question: 'What is Street Collector?',
      answer:
        'Street Collector is a premium illuminated art lamp with swappable limited-edition street art prints from independent artists worldwide.',
    },
  ]
}
