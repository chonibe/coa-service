/**
 * Shopify Metaobjects Helper
 * 
 * Functions to fetch metaobjects (like Homepage Banner Video) from Shopify.
 * Metaobjects are more flexible than metafields for storing structured content.
 */

import { storefrontQuery } from './storefront-client'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface MetaobjectFileReference {
  id: string
  alt?: string
  url?: string
  sources?: Array<{ url: string; mimeType: string }>
  /** Present on `... on MediaImage` references from Storefront API */
  image?: { url?: string }
}

export interface MetaobjectField {
  key: string
  value: string
  type: string
  reference?: MetaobjectFileReference | null
}

/** Matches direct video URLs stored in single-line / URL fields (not only file_reference). */
const VIDEO_URL_VALUE_PATTERN = /^https?:\/\/.+\.(mp4|webm|mov)(\?|#|$)/i

/**
 * Resolve a playable/file URL from a metaobject field reference (Video, MediaImage, GenericFile).
 */
export function extractUrlFromMetaobjectReference(
  ref: MetaobjectFileReference | null | undefined
): string | null {
  if (!ref) return null
  if (ref.sources?.[0]?.url) return ref.sources[0].url
  if (ref.image?.url) return ref.image.url
  if (ref.url) return ref.url
  return null
}

/**
 * Video URL from a field: `Video` sources, `GenericFile`/`url` when it looks like a video file, or raw HTTPS video in `value`.
 * Does not use `MediaImage` (those are posters / thumbnails).
 */
export function getVideoUrlFromMetaobjectField(
  field: MetaobjectField | undefined
): string | null {
  if (!field) return null
  const ref = field.reference
  if (ref?.sources?.[0]?.url) return ref.sources[0].url
  if (ref?.url && VIDEO_URL_VALUE_PATTERN.test(ref.url)) return ref.url
  const v = field.value?.trim()
  if (v && VIDEO_URL_VALUE_PATTERN.test(v)) return v
  return null
}

export interface Metaobject {
  id: string
  type: string
  handle: string
  fields: MetaobjectField[]
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get a metaobject by type and handle
 */
export async function getMetaobject(
  type: string,
  handle: string
): Promise<Metaobject | null> {
  const query = `
    query GetMetaobject($type: String!, $handle: String!) {
      metaobject(handle: {type: $type, handle: $handle}) {
        id
        type
        handle
        fields {
          key
          value
          type
          reference {
            ... on MediaImage {
              id
              alt
              image {
                url
              }
            }
            ... on Video {
              id
              alt
              sources {
                url
                mimeType
              }
            }
            ... on GenericFile {
              id
              url
            }
          }
        }
      }
    }
  `

  try {
    console.log(`[Metaobjects] Fetching metaobject type="${type}" handle="${handle}"`)
    
    const data = await storefrontQuery<{
      metaobject: Metaobject | null
    }>(query, { type, handle })

    if (!data.metaobject) {
      console.warn(`[Metaobjects] No metaobject found for type="${type}" handle="${handle}"`)
      console.warn('[Metaobjects] Make sure:')
      console.warn('  1. Metaobject type and handle match exactly')
      console.warn('  2. Storefront API has "unauthenticated_read_metaobjects" scope')
      console.warn('  3. Metaobject is published/active')
      return null
    }

    console.log(`[Metaobjects] ✅ Found metaobject: ${data.metaobject.handle}`)
    console.log(`[Metaobjects] Fields:`, data.metaobject.fields.map(f => f.key).join(', '))
    
    return data.metaobject
  } catch (error) {
    console.error(`[Metaobjects] ❌ Failed to fetch metaobject "${type}.${handle}":`, error)
    return null
  }
}

/**
 * List metaobjects by type
 */
export async function listMetaobjects(
  type: string,
  first: number = 10
): Promise<Metaobject[]> {
  const query = `
    query ListMetaobjects($type: String!, $first: Int!) {
      metaobjects(type: $type, first: $first) {
        edges {
          node {
            id
            type
            handle
            fields {
              key
              value
              type
            }
          }
        }
      }
    }
  `

  try {
    const data = await storefrontQuery<{
      metaobjects: {
        edges: Array<{ node: Metaobject }>
      }
    }>(query, { type, first })

    return data.metaobjects?.edges?.map(edge => edge.node) || []
  } catch (error) {
    console.error(`[Metaobjects] Failed to list metaobjects of type "${type}":`, error)
    return []
  }
}

/**
 * List metaobjects by type including `reference` on fields (Video / MediaImage URLs).
 * Use for definitions with file_reference fields (e.g. Meet the Lamp under-the-fold clips).
 */
export async function listMetaobjectsWithReferences(
  type: string,
  first: number = 25
): Promise<Metaobject[]> {
  const query = `
    query ListMetaobjectsWithRefs($type: String!, $first: Int!) {
      metaobjects(type: $type, first: $first) {
        edges {
          node {
            id
            type
            handle
            fields {
              key
              value
              type
              reference {
                ... on MediaImage {
                  id
                  alt
                  image {
                    url
                  }
                }
                ... on Video {
                  id
                  alt
                  sources {
                    url
                    mimeType
                  }
                }
                ... on GenericFile {
                  id
                  url
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const data = await storefrontQuery<{
      metaobjects: {
        edges: Array<{ node: Metaobject }>
      }
    }>(query, { type, first })

    return data.metaobjects?.edges?.map((edge) => edge.node) || []
  } catch (error) {
    console.error(
      `[Metaobjects] Failed to list metaobjects with references for type "${type}":`,
      error
    )
    return []
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a field value from a metaobject
 */
export function getMetaobjectField(
  metaobject: Metaobject | null,
  key: string
): string | null {
  if (!metaobject) return null
  
  const field = metaobject.fields.find(f => f.key === key)
  return field?.value || null
}

/**
 * Get a file reference URL from a metaobject field
 * For file_reference type fields (images, videos)
 */
export function getMetaobjectFileUrl(
  metaobject: Metaobject | null,
  key: string
): string | null {
  if (!metaobject) return null

  const field = metaobject.fields.find((f) => f.key === key)
  if (!field) return null

  const fromRef = extractUrlFromMetaobjectReference(field.reference ?? null)
  if (fromRef) return fromRef

  const v = field.value?.trim()
  if (v && VIDEO_URL_VALUE_PATTERN.test(v)) return v

  return null
}

/**
 * Parse JSON field value
 */
export function parseMetaobjectJSON<T>(
  metaobject: Metaobject | null,
  key: string
): T | null {
  const value = getMetaobjectField(metaobject, key)
  if (!value) return null
  
  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error(`[Metaobjects] Failed to parse JSON field "${key}":`, error)
    return null
  }
}

/**
 * Get all fields as a key-value object
 */
export function metaobjectToObject(
  metaobject: Metaobject | null
): Record<string, string> {
  if (!metaobject) return {}
  
  return metaobject.fields.reduce((acc, field) => {
    acc[field.key] = field.value
    return acc
  }, {} as Record<string, string>)
}
