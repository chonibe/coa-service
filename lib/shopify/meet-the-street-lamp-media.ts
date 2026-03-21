/**
 * Fetches per-stage video/poster (and optional title/description) for Meet the Street Lamp
 * from a Shopify metaobject entry whose definition uses a list of metaobject references.
 *
 * Env (optional):
 * - SHOPIFY_MEET_THE_STREET_LAMP_SECTION_TYPE — metaobject definition type (default: under_the_fold_section)
 * - SHOPIFY_MEET_THE_STREET_LAMP_SECTION_HANDLE — entry handle (default: under-the-fold-section-gedomnm3)
 */

import type { Metaobject, MetaobjectField } from './metaobjects'
import {
  getMetaobjectField,
  getMetaobjectFileUrl,
} from './metaobjects'
import { isStorefrontConfigured, storefrontQuery } from './storefront-client'

export type MeetTheStreetLampShopifyStage = {
  desktopVideo: string | null
  mobileVideo: string | null
  poster: string | null
  title: string | null
  description: string | null
}

const DEFAULT_METAOBJECT_TYPE =
  process.env.SHOPIFY_MEET_THE_STREET_LAMP_SECTION_TYPE ||
  'under_the_fold_section'

const DEFAULT_METAOBJECT_HANDLE =
  process.env.SHOPIFY_MEET_THE_STREET_LAMP_SECTION_HANDLE ||
  'under-the-fold-section-gedomnm3'

/** Prefer these field keys when multiple fields contain reference lists */
const PREFERRED_LIST_FIELD_KEYS = [
  'slides',
  'items',
  'steps',
  'blocks',
  'sections',
  'entries',
  'rows',
] as const

type ReferencesShape = {
  nodes?: Array<Metaobject | null> | null
  edges?: Array<{ node?: Metaobject | null } | null> | null
}

type ParentField = MetaobjectField & { references?: ReferencesShape | null }

const QUERY = `
  query MeetTheStreetLampSection($type: String!, $handle: String!) {
    metaobject(handle: { type: $type, handle: $handle }) {
      id
      type
      handle
      fields {
        key
        type
        value
        references(first: 30) {
          nodes {
            ... on Metaobject {
              handle
              type
              fields {
                key
                type
                value
                reference {
                  ... on Video {
                    id
                    sources {
                      url
                      mimeType
                    }
                    previewImage {
                      url
                    }
                  }
                  ... on MediaImage {
                    id
                    image {
                      url
                    }
                  }
                }
              }
            }
          }
          edges {
            node {
              ... on Metaobject {
                handle
                type
                fields {
                  key
                  type
                  value
                  reference {
                    ... on Video {
                      id
                      sources {
                        url
                        mimeType
                      }
                      previewImage {
                        url
                      }
                    }
                    ... on MediaImage {
                      id
                      image {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

function getReferenceNodes(field: ParentField): Metaobject[] {
  const r = field.references
  if (!r) return []
  if (Array.isArray(r.nodes) && r.nodes.length) {
    return r.nodes.filter((n): n is Metaobject => Boolean(n))
  }
  if (Array.isArray(r.edges) && r.edges.length) {
    return r.edges
      .map((e) => e?.node)
      .filter((n): n is Metaobject => Boolean(n))
  }
  return []
}

function findListMetaobjectField(fields: ParentField[]): ParentField | null {
  const withChildren = fields.filter((f) => getReferenceNodes(f).length > 0)
  if (!withChildren.length) return null
  for (const key of PREFERRED_LIST_FIELD_KEYS) {
    const hit = withChildren.find((f) => f.key === key)
    if (hit) return hit
  }
  return withChildren[0]
}

function imageUrlFromField(field: MetaobjectField | undefined): string | null {
  if (!field?.reference) return null
  const ref = field.reference as {
    sources?: Array<{ url: string }>
    image?: { url?: string }
    url?: string
  }
  if (ref.sources?.[0]?.url) return ref.sources[0].url
  if (ref.image?.url) return ref.image.url
  if (typeof ref.url === 'string' && ref.url) return ref.url
  return null
}

function videoPreviewUrl(child: Metaobject, keys: string[]): string | null {
  for (const key of keys) {
    const field = child.fields.find((f) => f.key === key)
    if (!field?.reference) continue
    const ref = field.reference as { previewImage?: { url?: string } }
    if (ref.previewImage?.url) return ref.previewImage.url
  }
  return null
}

function parseChildMetaobject(child: Metaobject): MeetTheStreetLampShopifyStage {
  const desktop =
    getMetaobjectFileUrl(child, 'video_desktop') ||
    getMetaobjectFileUrl(child, 'desktop_video') ||
    getMetaobjectFileUrl(child, 'video')

  const mobile =
    getMetaobjectFileUrl(child, 'video_mobile') ||
    getMetaobjectFileUrl(child, 'mobile_video') ||
    desktop

  const poster =
    imageUrlFromField(child.fields.find((f) => f.key === 'poster')) ||
    imageUrlFromField(child.fields.find((f) => f.key === 'preview_image')) ||
    imageUrlFromField(child.fields.find((f) => f.key === 'image')) ||
    videoPreviewUrl(child, ['video', 'video_desktop', 'video_mobile'])

  const title =
    getMetaobjectField(child, 'title') ||
    getMetaobjectField(child, 'heading') ||
    getMetaobjectField(child, 'name')

  const description =
    getMetaobjectField(child, 'description') ||
    getMetaobjectField(child, 'body') ||
    getMetaobjectField(child, 'text')

  return {
    desktopVideo: desktop,
    mobileVideo: mobile,
    poster,
    title: title?.trim() || null,
    description: description?.trim() || null,
  }
}

/**
 * Returns ordered stage payloads from Shopify (one per linked child metaobject), or [] if
 * misconfigured, missing, or Storefront API unavailable.
 */
export async function fetchMeetTheStreetLampStageMediaFromShopify(): Promise<
  MeetTheStreetLampShopifyStage[]
> {
  if (!isStorefrontConfigured()) {
    return []
  }

  const type = DEFAULT_METAOBJECT_TYPE
  const handle = DEFAULT_METAOBJECT_HANDLE

  try {
    const data = await storefrontQuery<{
      metaobject: (Metaobject & { fields: ParentField[] }) | null
    }>(QUERY, { type, handle })

    const parent = data.metaobject
    if (!parent?.fields?.length) {
      console.warn(
        `[MeetTheStreetLamp] No metaobject or fields for type="${type}" handle="${handle}"`
      )
      return []
    }

    const listField = findListMetaobjectField(parent.fields)
    if (!listField) {
      console.warn(
        `[MeetTheStreetLamp] Metaobject "${handle}" has no list of metaobject references`
      )
      return []
    }

    const children = getReferenceNodes(listField)
    if (!children.length) {
      return []
    }

    console.log(
      `[MeetTheStreetLamp] Loaded ${children.length} stage media row(s) from Shopify`
    )
    return children.map(parseChildMetaobject)
  } catch (e) {
    console.error('[MeetTheStreetLamp] Failed to fetch section metaobject:', e)
    return []
  }
}
