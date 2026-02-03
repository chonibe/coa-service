/**
 * Shopify Pages Queries
 * 
 * Fetches static pages from the Shopify Storefront API.
 * Used for About, Contact, Policy pages, and other static content.
 */

import { storefrontQuery } from './storefront-client'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ShopifyPage {
  id: string
  handle: string
  title: string
  body: string // HTML content
  bodySummary: string
  createdAt: string
  updatedAt: string
  seo?: {
    title: string | null
    description: string | null
  }
}

export interface PagesConnection {
  edges: Array<{ node: ShopifyPage }>
  pageInfo: {
    hasNextPage: boolean
    endCursor: string | null
  }
}

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

const PAGE_FRAGMENT = `
  fragment PageFields on Page {
    id
    handle
    title
    body
    bodySummary
    createdAt
    updatedAt
    seo {
      title
      description
    }
  }
`

const GET_PAGE_QUERY = `
  ${PAGE_FRAGMENT}
  query GetPage($handle: String!) {
    page(handle: $handle) {
      ...PageFields
    }
  }
`

const GET_PAGES_QUERY = `
  ${PAGE_FRAGMENT}
  query GetPages($first: Int!, $after: String) {
    pages(first: $first, after: $after) {
      edges {
        node {
          ...PageFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

const GET_PAGES_BY_HANDLES_QUERY = `
  ${PAGE_FRAGMENT}
  query GetPagesByHandles($handles: [String!]!) {
    nodes(ids: []) {
      ... on Page {
        ...PageFields
      }
    }
  }
`

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get a single page by handle
 */
export async function getPage(handle: string): Promise<ShopifyPage | null> {
  try {
    const data = await storefrontQuery<{ page: ShopifyPage | null }>(GET_PAGE_QUERY, { handle })
    return data.page
  } catch (error) {
    console.error(`Error fetching page "${handle}":`, error)
    return null
  }
}

/**
 * Get all pages with pagination
 */
export async function getPages(options: {
  first?: number
  after?: string
} = {}): Promise<{
  pages: ShopifyPage[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}> {
  const { first = 50, after } = options
  
  try {
    const data = await storefrontQuery<{ pages: PagesConnection }>(GET_PAGES_QUERY, { first, after })
    return {
      pages: data.pages.edges.map(edge => edge.node),
      pageInfo: data.pages.pageInfo,
    }
  } catch (error) {
    console.error('Error fetching pages:', error)
    return {
      pages: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    }
  }
}

/**
 * Get all pages (auto-pagination)
 */
export async function getAllPages(): Promise<ShopifyPage[]> {
  const allPages: ShopifyPage[] = []
  let hasNextPage = true
  let cursor: string | null = null
  
  while (hasNextPage) {
    const { pages, pageInfo } = await getPages({ 
      first: 50, 
      after: cursor || undefined 
    })
    
    allPages.push(...pages)
    hasNextPage = pageInfo.hasNextPage
    cursor = pageInfo.endCursor
  }
  
  return allPages
}

/**
 * Get multiple pages by handles
 */
export async function getPagesByHandles(handles: string[]): Promise<ShopifyPage[]> {
  const pages: ShopifyPage[] = []
  
  // Fetch pages in parallel
  const promises = handles.map(async (handle) => {
    const page = await getPage(handle)
    if (page) pages.push(page)
  })
  
  await Promise.all(promises)
  return pages
}

// =============================================================================
// COMMON PAGE HANDLES
// =============================================================================

export const COMMON_PAGE_HANDLES = [
  'about',
  'contact',
  'terms-of-service',
  'privacy-policy',
  'refund-policy',
  'shipping-policy',
] as const

export type CommonPageHandle = typeof COMMON_PAGE_HANDLES[number]

/**
 * Get all common/expected pages
 */
export async function getCommonPages(): Promise<Record<string, ShopifyPage | null>> {
  const result: Record<string, ShopifyPage | null> = {}
  
  const promises = COMMON_PAGE_HANDLES.map(async (handle) => {
    result[handle] = await getPage(handle)
  })
  
  await Promise.all(promises)
  return result
}

// =============================================================================
// PAGE CONTENT UTILITIES
// =============================================================================

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Get page excerpt (plain text summary)
 */
export function getPageExcerpt(page: ShopifyPage, maxLength: number = 160): string {
  if (page.bodySummary) {
    return truncateText(page.bodySummary, maxLength)
  }
  return truncateText(stripHtml(page.body), maxLength)
}

// =============================================================================
// CACHED PAGE FUNCTIONS
// =============================================================================

// In-memory cache for pages
const pageCache: Map<string, { data: ShopifyPage | null; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get a page with caching
 */
export async function getCachedPage(handle: string): Promise<ShopifyPage | null> {
  const now = Date.now()
  const cached = pageCache.get(handle)
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  
  const page = await getPage(handle)
  pageCache.set(handle, { data: page, timestamp: now })
  return page
}

/**
 * Clear page cache
 */
export function clearPageCache(): void {
  pageCache.clear()
}
