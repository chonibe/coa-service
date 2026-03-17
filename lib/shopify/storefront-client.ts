/**
 * Shopify Storefront API Client
 * 
 * GraphQL client for the Shopify Storefront API.
 * Used for public product data, collections, cart operations.
 * 
 * @requires SHOPIFY_SHOP - Shopify store domain (e.g., 'my-store.myshopify.com')
 * @requires NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN - Storefront API access token
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || process.env.NEXT_PUBLIC_SHOPIFY_SHOP || ''
// Storefront API token (not Admin API token which starts with shpat_)
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || ''
const API_VERSION = '2024-01'
// 35s default: cold start + Shopify latency often exceed 20s; set SHOPIFY_STOREFRONT_TIMEOUT_MS in Vercel if needed
const STOREFRONT_TIMEOUT_MS = Number(process.env.SHOPIFY_STOREFRONT_TIMEOUT_MS || 35000)

const STOREFRONT_URL = `https://${SHOPIFY_SHOP}/api/${API_VERSION}/graphql.json`

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if Storefront API is properly configured
 */
export function isStorefrontConfigured(): boolean {
  return Boolean(SHOPIFY_SHOP && STOREFRONT_TOKEN)
}

/**
 * Get configuration status for debugging
 */
export function getStorefrontConfigStatus(): {
  configured: boolean
  shopDomain: string
  hasToken: boolean
  tokenType: 'storefront' | 'admin' | 'unknown' | 'missing'
} {
  let tokenType: 'storefront' | 'admin' | 'unknown' | 'missing' = 'missing'
  
  if (STOREFRONT_TOKEN) {
    if (STOREFRONT_TOKEN.startsWith('shpat_')) {
      tokenType = 'admin' // Wrong token type!
    } else if (STOREFRONT_TOKEN.length > 0) {
      tokenType = 'storefront'
    } else {
      tokenType = 'unknown'
    }
  }
  
  return {
    configured: Boolean(SHOPIFY_SHOP && STOREFRONT_TOKEN),
    shopDomain: SHOPIFY_SHOP ? `${SHOPIFY_SHOP.substring(0, 10)}...` : '(not set)',
    hasToken: Boolean(STOREFRONT_TOKEN),
    tokenType,
  }
}

// =============================================================================
// GRAPHQL CLIENT
// =============================================================================

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
    extensions?: Record<string, unknown>
  }>
}

/**
 * Execute a GraphQL query against the Shopify Storefront API
 */
export async function storefrontQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  // Check configuration before making request
  if (!SHOPIFY_SHOP) {
    throw new Error(
      'Shopify Storefront API not configured: Missing SHOPIFY_SHOP or NEXT_PUBLIC_SHOPIFY_SHOP environment variable. ' +
      'Please set your Shopify store domain (e.g., "my-store.myshopify.com").'
    )
  }
  
  if (!STOREFRONT_TOKEN) {
    throw new Error(
      'Shopify Storefront API not configured: Missing NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN or SHOPIFY_STOREFRONT_ACCESS_TOKEN. ' +
      'Please create a Storefront API access token in your Shopify Admin under Apps > Develop apps.'
    )
  }
  
  // Warn if using wrong token type
  if (STOREFRONT_TOKEN.startsWith('shpat_')) {
    console.warn(
      '⚠️ WARNING: You are using an Admin API token (shpat_...) for the Storefront API. ' +
      'This will not work. Please create a Storefront API access token instead.'
    )
  }

  const attemptFetch = async (): Promise<Response> => {
    return fetch(STOREFRONT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(STOREFRONT_TIMEOUT_MS),
    })
  }

  let response: Response
  try {
    response = await attemptFetch()
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      // Retry once on timeout — Vercel serverless cold starts can push the first
      // request over the limit; a second attempt usually succeeds.
      console.warn(`[Shopify] First attempt timed out after ${STOREFRONT_TIMEOUT_MS}ms — retrying once`)
      try {
        response = await attemptFetch()
      } catch (retryError: any) {
        if (retryError?.name === 'TimeoutError' || retryError?.name === 'AbortError') {
          throw new Error(`Shopify Storefront request timed out after ${STOREFRONT_TIMEOUT_MS}ms (both attempts)`)
        }
        throw retryError
      }
    } else {
      throw error
    }
  }

  const json: GraphQLResponse<T> = await response.json()

  if (json.errors) {
    console.error('Storefront API errors:', json.errors)
    
    // Provide more helpful error messages
    const firstError = json.errors[0]
    if (firstError?.extensions?.code === 'UNAUTHORIZED') {
      throw new Error(
        'Shopify Storefront API authorization failed. Please verify: ' +
        '1) Your NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN is a valid Storefront API token (not Admin API), ' +
        '2) The token has not expired, ' +
        '3) The token has the required scopes for the data you are requesting.'
      )
    }
    
    throw new Error(firstError?.message || 'GraphQL error')
  }

  if (!json.data) {
    throw new Error('No data returned from Storefront API')
  }

  return json.data
}

/**
 * Run a Storefront query with a specific token (e.g. private token for unlisted products).
 */
async function storefrontQueryWithToken<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_SHOP || !token) throw new Error('Storefront: shop and token required')
  let response: Response
  try {
    response = await fetch(STOREFRONT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(STOREFRONT_TIMEOUT_MS),
    })
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new Error(`Shopify Storefront request timed out after ${STOREFRONT_TIMEOUT_MS}ms`)
    }
    throw error
  }
  const json: GraphQLResponse<T> = await response.json()
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error')
  if (!json.data) throw new Error('No data from Storefront API')
  return json.data
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ShopifyImage {
  url: string
  altText: string | null
  width: number
  height: number
}

export interface ShopifyMoney {
  amount: string
  currencyCode: string
}

export interface ShopifyProductVariant {
  id: string
  title: string
  availableForSale: boolean
  quantityAvailable?: number
  price: ShopifyMoney
  compareAtPrice: ShopifyMoney | null
  selectedOptions: Array<{
    name: string
    value: string
  }>
  image: ShopifyImage | null
}

// =============================================================================
// MEDIA TYPE DEFINITIONS
// =============================================================================

export type MediaContentType = 'IMAGE' | 'VIDEO' | 'EXTERNAL_VIDEO' | 'MODEL_3D'

export interface ShopifyVideoSource {
  url: string
  mimeType: string
  format: string
  height: number
  width: number
}

export interface ShopifyVideo {
  id: string
  mediaContentType: 'VIDEO'
  sources: ShopifyVideoSource[]
  previewImage: ShopifyImage | null
}

export interface ShopifyExternalVideo {
  id: string
  mediaContentType: 'EXTERNAL_VIDEO'
  host: 'YOUTUBE' | 'VIMEO'
  embeddedUrl: string
  previewImage: ShopifyImage | null
}

export interface ShopifyMediaImage {
  id: string
  mediaContentType: 'IMAGE'
  image: ShopifyImage
}

export interface ShopifyModel3dSource {
  url: string
  mimeType: string
  format: string
}

export interface ShopifyModel3d {
  id: string
  mediaContentType: 'MODEL_3D'
  sources: ShopifyModel3dSource[]
  previewImage: ShopifyImage | null
}

export type ShopifyMedia = ShopifyVideo | ShopifyExternalVideo | ShopifyMediaImage | ShopifyModel3d

export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  vendor: string
  productType: string
  tags: string[]
  availableForSale: boolean
  priceRange: {
    minVariantPrice: ShopifyMoney
    maxVariantPrice: ShopifyMoney
  }
  compareAtPriceRange: {
    minVariantPrice: ShopifyMoney
    maxVariantPrice: ShopifyMoney
  }
  featuredImage: ShopifyImage | null
  images: {
    edges: Array<{ node: ShopifyImage }>
  }
  media?: {
    edges: Array<{ node: ShopifyMedia }>
  }
  variants: {
    edges: Array<{ node: ShopifyProductVariant }>
  }
  options: Array<{
    id: string
    name: string
    values: string[]
  }>
  metafields: Array<{
    key: string
    value: string
    namespace: string
  }> | null
}

export interface ShopifyCollection {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  image: ShopifyImage | null
  /** Collection metafield custom.instagram (handle or URL) */
  metafield?: { value?: string } | null
  /** Collection metafield custom.gif — URL for GIF overlay on artist spotlight card when collapsed */
  gifMetafield?: { value?: string } | null
  /** Collection metafield custom.unlisted — when truthy, hide from default experience spotlight (only via direct link) */
  unlistedMetafield?: { value?: string } | null
  /** Collection metafield custom.product_handles — comma-separated product handles for unlisted products (Storefront omits unlisted from collection.products) */
  productHandlesMetafield?: { value?: string } | null
  products: {
    edges: Array<{ node: ShopifyProduct }>
    pageInfo: {
      hasNextPage: boolean
      endCursor: string | null
    }
  }
}

// =============================================================================
// GRAPHQL FRAGMENTS
// =============================================================================

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    media(first: 20) {
      edges {
        node {
          mediaContentType
          ... on Video {
            id
            sources {
              url
              mimeType
              format
              height
              width
            }
            previewImage {
              url
              altText
              width
              height
            }
          }
          ... on ExternalVideo {
            id
            host
            embeddedUrl
            previewImage {
              url
              altText
              width
              height
            }
          }
          ... on MediaImage {
            id
            image {
              url
              altText
              width
              height
            }
          }
          ... on Model3d {
            id
            sources {
              url
              mimeType
              format
            }
            previewImage {
              url
              altText
              width
              height
            }
          }
        }
      }
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
    options {
      id
      name
      values
    }
    metafields(identifiers: [{namespace: "custom", key: "edition_size"}]) {
      namespace
      key
      value
    }
  }
`

const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCardFields on Product {
    id
    handle
    title
    vendor
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
  }
`

/** Lightweight fragment for experience artwork strip. Excludes description, media, full variants. */
const PRODUCT_LIST_FRAGMENT = `
  fragment ProductListFields on Product {
    id
    handle
    title
    vendor
    productType
    tags
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 2) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 1) {
      edges {
        node {
          id
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
`

const COLLECTION_FRAGMENT = `
  fragment CollectionFields on Collection {
    id
    handle
    title
    description
    descriptionHtml
    image {
      url
      altText
      width
      height
    }
    metafield: metafield(namespace: "custom", key: "instagram") {
      value
    }
    gifMetafield: metafield(namespace: "custom", key: "gif") {
      value
    }
    unlistedMetafield: metafield(namespace: "custom", key: "unlisted") {
      value
    }
    productHandlesMetafield: metafield(namespace: "custom", key: "product_handles") {
      value
    }
  }
`

// =============================================================================
// PRODUCT QUERIES
// =============================================================================

/**
 * Get a single product by handle
 */
export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        ...ProductFields
      }
    }
  `

  const data = await storefrontQuery<{ product: ShopifyProduct | null }>(query, { handle })
  return data.product
}

/**
 * Get multiple products by handles.
 * When products are unlisted, the public Storefront token often returns null. Use
 * options.preferPrivateToken when handles came from Admin API (unlisted) so we use
 * SHOPIFY_STOREFRONT_PRIVATE_TOKEN first. Otherwise we retry with it if the first request returns 0 or throws.
 */
export async function getProductsByHandles(
  handles: string[],
  options?: { preferPrivateToken?: boolean }
): Promise<ShopifyProduct[]> {
  if (handles.length === 0) return []

  // Prefer dedicated private token; fall back to SHOPIFY_STOREFRONT_ACCESS_TOKEN (often the private/custom app token in Vercel)
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || ''

  const aliases = handles.map((handle, i) => `
    product_${i}: product(handle: "${handle}") {
      ...ProductFields
    }
  `).join('\n')

  const query = `
    ${PRODUCT_FRAGMENT}
    query GetProducts {
      ${aliases}
    }
  `

  let data: Record<string, ShopifyProduct | null>
  let products: ShopifyProduct[]

  const runWithToken = (token: string) =>
    storefrontQueryWithToken<Record<string, ShopifyProduct | null>>(token, query)

  if (options?.preferPrivateToken && privateToken) {
    try {
      data = await runWithToken(privateToken)
      products = Object.values(data).filter((p): p is ShopifyProduct => p !== null)
      return products
    } catch {
      // fall through to default token
    }
  }

  try {
    data = await storefrontQuery<Record<string, ShopifyProduct | null>>(query)
    products = Object.values(data).filter((p): p is ShopifyProduct => p !== null)
  } catch {
    products = []
  }

  if (products.length === 0 && handles.length > 0 && privateToken) {
    try {
      data = await runWithToken(privateToken)
      products = Object.values(data).filter((p): p is ShopifyProduct => p !== null)
    } catch {
      // keep previous result
    }
  }

  return products
}

/**
 * Get products with pagination
 */
export async function getProducts(options: {
  first?: number
  after?: string
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT' | 'UPDATED_AT'
  reverse?: boolean
  query?: string
} = {}): Promise<{
  products: ShopifyProduct[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}> {
  const { first = 20, after, sortKey = 'BEST_SELLING', reverse = false, query: searchQuery } = options

  const query = `
    ${PRODUCT_CARD_FRAGMENT}
    query GetProducts($first: Int!, $after: String, $sortKey: ProductSortKeys, $reverse: Boolean, $query: String) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, query: $query) {
        edges {
          node {
            ...ProductCardFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `

  const data = await storefrontQuery<{
    products: {
      edges: Array<{ node: ShopifyProduct }>
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }
  }>(query, { first, after, sortKey, reverse, query: searchQuery })

  return {
    products: data.products?.edges?.map(edge => edge.node) || [],
    pageInfo: data.products?.pageInfo || { hasNextPage: false, endCursor: null },
  }
}

/**
 * Get products by vendor/artist name
 */
export async function getProductsByVendor(vendorName: string, options: {
  first?: number
  after?: string
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT' | 'UPDATED_AT'
  reverse?: boolean
} = {}): Promise<{
  products: ShopifyProduct[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}> {
  const { first = 20, after, sortKey = 'CREATED_AT', reverse = true } = options

  // Use Shopify's query syntax to filter by vendor
  const searchQuery = `vendor:${vendorName}`

  return getProducts({
    first,
    after,
    sortKey,
    reverse,
    query: searchQuery,
  })
}

// =============================================================================
// COLLECTION QUERIES
// =============================================================================

/**
 * Get a collection by Shopify ID (numeric or GID) with products.
 * Use when vendor_collections.shopify_collection_id is available.
 */
export async function getCollectionById(
  id: string,
  options: {
    first?: number
    after?: string
    sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'UPDATED_AT' | 'MANUAL'
    reverse?: boolean
  } = {}
): Promise<ShopifyCollection | null> {
  const gid = id.startsWith('gid://') ? id : `gid://shopify/Collection/${id}`
  const { first = 20, after, sortKey = 'CREATED', reverse = true } = options

  const query = `
    ${COLLECTION_FRAGMENT}
    ${PRODUCT_CARD_FRAGMENT}
    query GetCollectionById($id: ID!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
      collection(id: $id) {
        ...CollectionFields
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              ...ProductCardFields
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  try {
    const data = await storefrontQuery<{ collection: ShopifyCollection | null }>(query, {
      id: gid,
      first,
      after,
      sortKey,
      reverse,
    })
    return data.collection
  } catch {
    return null
  }
}

/**
 * Get a single collection by handle with products
 */
export async function getCollection(handle: string, options: {
  first?: number
  after?: string
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'UPDATED_AT' | 'MANUAL'
  reverse?: boolean
} = {}): Promise<ShopifyCollection | null> {
  const { first = 20, after, sortKey = 'BEST_SELLING', reverse = false } = options

  const query = `
    ${COLLECTION_FRAGMENT}
    ${PRODUCT_CARD_FRAGMENT}
    query GetCollection($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
      collection(handle: $handle) {
        ...CollectionFields
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              ...ProductCardFields
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  const data = await storefrontQuery<{ collection: ShopifyCollection | null }>(query, {
    handle,
    first,
    after,
    sortKey,
    reverse,
  })

  return data.collection
}

/**
 * Get a collection with full product data (images, variants, description).
 * Used by the configurator experience page which needs richer product data
 * than the card fragment provides.
 */
export async function getCollectionWithFullProducts(handle: string, options: {
  first?: number
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'UPDATED_AT' | 'MANUAL'
  reverse?: boolean
} = {}): Promise<ShopifyCollection | null> {
  const { first = 24, sortKey = 'MANUAL', reverse = false } = options

  const query = `
    ${COLLECTION_FRAGMENT}
    ${PRODUCT_FRAGMENT}
    query GetCollectionFull($handle: String!, $first: Int!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
      collection(handle: $handle) {
        ...CollectionFields
        products(first: $first, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              ...ProductFields
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  const data = await storefrontQuery<{ collection: ShopifyCollection | null }>(query, {
    handle,
    first,
    sortKey,
    reverse,
  })

  return data.collection
}

/**
 * Get a collection with lightweight product data for the experience artwork strip.
 * Uses ProductListFields (no description, media, full variants). Fetch full product
 * on-demand when user opens ArtworkDetail.
 */
export async function getCollectionWithListProducts(handle: string, options: {
  first?: number
  after?: string
  sortKey?: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED' | 'UPDATED_AT' | 'MANUAL'
  reverse?: boolean
} = {}): Promise<ShopifyCollection | null> {
  const { first = 24, after, sortKey = 'MANUAL', reverse = false } = options

  const query = `
    ${COLLECTION_FRAGMENT}
    ${PRODUCT_LIST_FRAGMENT}
    query GetCollectionList($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
      collection(handle: $handle) {
        ...CollectionFields
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              ...ProductListFields
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  const data = await storefrontQuery<{ collection: ShopifyCollection | null }>(query, {
    handle,
    first,
    after: after ?? null,
    sortKey,
    reverse,
  })

  return data.collection
}

/**
 * Fetch two named season collections in a single GraphQL request to minimise
 * Shopify Storefront round-trips. Returns [season1, season2] — either may be
 * null if the collection doesn't exist or the request fails.
 */
export async function getSeasonCollections(
  handle1: string,
  handle2: string,
  options: { first?: number } = {}
): Promise<[ShopifyCollection | null, ShopifyCollection | null]> {
  const { first = 24 } = options

  const query = `
    ${COLLECTION_FRAGMENT}
    ${PRODUCT_LIST_FRAGMENT}
    query GetSeasonCollections($first: Int!) {
      season1: collection(handle: "${handle1}") {
        ...CollectionFields
        products(first: $first, sortKey: MANUAL) {
          edges {
            node {
              ...ProductListFields
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
      season2: collection(handle: "${handle2}") {
        ...CollectionFields
        products(first: $first, sortKey: MANUAL) {
          edges {
            node {
              ...ProductListFields
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  try {
    const data = await storefrontQuery<{
      season1: ShopifyCollection | null
      season2: ShopifyCollection | null
    }>(query, { first })
    return [data.season1, data.season2]
  } catch (err) {
    console.error('[Shopify] getSeasonCollections failed:', err)
    return [null, null]
  }
}

/**
 * Get multiple collections
 */
export async function getCollections(options: {
  first?: number
  after?: string
} = {}): Promise<{
  collections: ShopifyCollection[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
}> {
  const { first = 50, after } = options

  const query = `
    ${COLLECTION_FRAGMENT}
    query GetCollections($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        edges {
          node {
            ...CollectionFields
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `

  const data = await storefrontQuery<{
    collections: {
      edges: Array<{ node: ShopifyCollection }>
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
    }
  }>(query, { first, after })

  return {
    collections: data.collections?.edges?.map(edge => edge.node) || [],
    pageInfo: data.collections?.pageInfo || { hasNextPage: false, endCursor: null },
  }
}

// =============================================================================
// SEARCH QUERIES
// =============================================================================

/**
 * Predictive search for products, collections, and pages
 */
export async function predictiveSearch(searchQuery: string, options: {
  limit?: number
  types?: Array<'PRODUCT' | 'COLLECTION' | 'PAGE' | 'ARTICLE'>
} = {}): Promise<{
  products: ShopifyProduct[]
  collections: ShopifyCollection[]
}> {
  const { limit = 10, types = ['PRODUCT', 'COLLECTION'] } = options

  const query = `
    ${PRODUCT_CARD_FRAGMENT}
    ${COLLECTION_FRAGMENT}
    query PredictiveSearch($query: String!, $limit: Int!, $types: [PredictiveSearchType!]) {
      predictiveSearch(query: $query, limit: $limit, types: $types) {
        products {
          ...ProductCardFields
        }
        collections {
          ...CollectionFields
        }
      }
    }
  `

  const data = await storefrontQuery<{
    predictiveSearch: {
      products: ShopifyProduct[]
      collections: ShopifyCollection[]
    }
  }>(query, { query: searchQuery, limit, types })

  return data.predictiveSearch
}

// =============================================================================
// CART OPERATIONS
// =============================================================================

export interface CartLine {
  id: string
  quantity: number
  merchandise: {
    id: string
    title: string
    product: {
      title: string
      handle: string
    }
    price: ShopifyMoney
    image: ShopifyImage | null
  }
}

export interface Cart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    subtotalAmount: ShopifyMoney
    totalAmount: ShopifyMoney
    totalTaxAmount: ShopifyMoney | null
  }
  lines: {
    edges: Array<{ node: CartLine }>
  }
}

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              product {
                title
                handle
              }
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
`

/**
 * Create a new cart
 */
export async function createCart(lines?: Array<{ merchandiseId: string; quantity: number }>): Promise<Cart> {
  const query = `
    ${CART_FRAGMENT}
    mutation CreateCart($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await storefrontQuery<{
    cartCreate: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>(query, { lines })

  if (data.cartCreate.userErrors.length > 0) {
    throw new Error(data.cartCreate.userErrors[0].message)
  }

  return data.cartCreate.cart
}

/**
 * Get an existing cart
 */
export async function getCart(cartId: string): Promise<Cart | null> {
  const query = `
    ${CART_FRAGMENT}
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        ...CartFields
      }
    }
  `

  const data = await storefrontQuery<{ cart: Cart | null }>(query, { cartId })
  return data.cart
}

/**
 * Add lines to cart
 */
export async function addToCart(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<Cart> {
  const query = `
    ${CART_FRAGMENT}
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await storefrontQuery<{
    cartLinesAdd: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>(query, { cartId, lines })

  if (data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors[0].message)
  }

  return data.cartLinesAdd.cart
}

/**
 * Update cart lines
 */
export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<Cart> {
  const query = `
    ${CART_FRAGMENT}
    mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await storefrontQuery<{
    cartLinesUpdate: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>(query, { cartId, lines })

  if (data.cartLinesUpdate.userErrors.length > 0) {
    throw new Error(data.cartLinesUpdate.userErrors[0].message)
  }

  return data.cartLinesUpdate.cart
}

/**
 * Remove lines from cart
 */
export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const query = `
    ${CART_FRAGMENT}
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await storefrontQuery<{
    cartLinesRemove: {
      cart: Cart
      userErrors: Array<{ field: string[]; message: string }>
    }
  }>(query, { cartId, lineIds })

  if (data.cartLinesRemove.userErrors.length > 0) {
    throw new Error(data.cartLinesRemove.userErrors[0].message)
  }

  return data.cartLinesRemove.cart
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format Shopify price
 */
export function formatPrice(money: ShopifyMoney): string {
  const amount = parseFloat(money.amount)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currencyCode,
  }).format(amount)
}

/**
 * Check if product is on sale
 */
export function isOnSale(product: ShopifyProduct): boolean {
  const minPrice = parseFloat(product.priceRange.minVariantPrice.amount)
  const compareAtPrice = parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount || '0')
  return compareAtPrice > 0 && compareAtPrice > minPrice
}

/**
 * Calculate discount percentage
 */
export function getDiscountPercentage(product: ShopifyProduct): number {
  const minPrice = parseFloat(product.priceRange.minVariantPrice.amount)
  const compareAtPrice = parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount || '0')
  
  if (compareAtPrice <= 0 || compareAtPrice <= minPrice) return 0
  
  return Math.round(((compareAtPrice - minPrice) / compareAtPrice) * 100)
}

/**
 * Get Shopify image URL with size transformation
 */
export function getImageUrl(url: string, size?: number): string {
  if (!url || !size) return url
  
  // Shopify CDN URL transformation
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = url.match(/(.+)\.(\w+)(\?.*)?$/)
  if (match) {
    return `${match[1]}_${size}x.${match[2]}${match[3] || ''}`
  }
  
  return url
}

/**
 * Extract global product ID from Shopify GID
 */
export function extractProductId(gid: string): string {
  const match = gid.match(/gid:\/\/shopify\/Product\/(\d+)/)
  return match ? match[1] : gid
}

/**
 * Extract global variant ID from Shopify GID
 */
export function extractVariantId(gid: string): string {
  const match = gid.match(/gid:\/\/shopify\/ProductVariant\/(\d+)/)
  return match ? match[1] : gid
}
