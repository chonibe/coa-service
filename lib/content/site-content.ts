import { siteContent, type CollectorPageId, type StorePageId } from '@/content/site-content'

export function getSiteContent() {
  return siteContent
}

export function getStorePageContent<PageId extends StorePageId>(pageId: PageId) {
  return siteContent.store[pageId]
}

export function getCollectorPageContent<PageId extends CollectorPageId>(pageId: PageId) {
  return siteContent.collector[pageId]
}
