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
}

export interface MetaobjectField {
  key: string
  value: string
  type: string
  reference?: MetaobjectFileReference | null
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

    return data.metaobjects.edges.map(edge => edge.node)
  } catch (error) {
    console.error(`[Metaobjects] Failed to list metaobjects of type "${type}":`, error)
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
  
  const field = metaobject.fields.find(f => f.key === key)
  if (!field?.reference) return null
  
  // Check for video sources
  if ('sources' in field.reference && field.reference.sources && field.reference.sources.length > 0) {
    return field.reference.sources[0].url
  }
  
  // Check for image URL
  if ('image' in field.reference && field.reference.url) {
    return field.reference.url
  }
  
  return field.reference.url || null
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
