import { collectorPageContent } from '@/content/site/collector'
import { storePageContent } from '@/content/site/store'

export const siteContent = {
  store: storePageContent,
  collector: collectorPageContent,
} as const

export type SiteContent = typeof siteContent
export type StorePageId = keyof typeof siteContent.store
export type CollectorPageId = keyof typeof siteContent.collector
