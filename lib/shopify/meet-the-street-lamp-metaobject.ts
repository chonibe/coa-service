/**
 * Meet the Street Lamp — videos from Shopify metaobject
 *
 * Entry: definition type + handle (default under-the-fold-section-gedomnm3).
 * Supports:
 * - File / video fields on the parent metaobject keyed by stage slug (e.g. set_the_light, set_the_light_video)
 * - List of child metaobjects (metaobject_reference list) with title + video file fields
 *
 * Override via SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE and SHOPIFY_UNDER_THE_FOLD_METAOBJECT_HANDLE
 */

import { storefrontQuery } from './storefront-client'
import {
  getMetaobjectField,
  getMetaobjectFileUrl,
  referenceToUrl,
  type Metaobject,
  type MetaobjectField,
  type MetaobjectFileReference,
} from './metaobjects'

const DEFAULT_METAOBJECT_TYPE = 'under_the_fold_section'
const DEFAULT_METAOBJECT_HANDLE = 'under-the-fold-section-gedomnm3'

const MEET_THE_FOLD_QUERY = `
  query StreetCollectorUnderTheFold($type: String!, $handle: String!) {
    metaobject(handle: { type: $type, handle: $handle }) {
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
        references(first: 30) {
          edges {
            node {
              ... on Metaobject {
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
      }
    }
  }
`

type FieldWithRefs = MetaobjectField & {
  references?: {
    edges: Array<{
      node?: {
        id?: string
        type?: string
        handle?: string
        fields?: MetaobjectField[]
      }
    }>
  }
}

interface MetaobjectWithRefLists extends Omit<Metaobject, 'fields'> {
  fields: FieldWithRefs[]
}

export function normalizeMeetLampStageTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function titleToSlugKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

const CHILD_TITLE_KEYS = ['title', 'heading', 'name', 'label', 'step_title'] as const
const CHILD_VIDEO_KEYS = [
  'video',
  'video_file',
  'file',
  'media',
  'clip',
  'desktop_video',
  'mobile_video',
] as const

function childDisplayTitle(mo: Metaobject): string | null {
  for (const key of CHILD_TITLE_KEYS) {
    const v = getMetaobjectField(mo, key)
    if (v?.trim()) return v.trim()
  }
  return null
}

function bestVideoUrlFromMetaobject(mo: Metaobject): string | null {
  for (const key of CHILD_VIDEO_KEYS) {
    const u = getMetaobjectFileUrl(mo, key)
    if (u) return u
  }
  for (const f of mo.fields) {
    const u = referenceToUrl(f.reference as MetaobjectFileReference)
    if (u && (/\.(mp4|webm|mov)(\?|$)/i.test(u) || u.includes('/videos/'))) return u
  }
  return null
}

function collectNestedTitleVideoMap(meta: MetaobjectWithRefLists): Map<string, string> {
  const map = new Map<string, string>()
  for (const f of meta.fields) {
    const edges = f.references?.edges
    if (!edges?.length) continue
    for (const e of edges) {
      const node = e.node
      if (!node?.fields?.length) continue
      const child: Metaobject = {
        id: node.id || '',
        type: node.type || '',
        handle: node.handle || '',
        fields: node.fields,
      }
      const title = childDisplayTitle(child)
      const url = bestVideoUrlFromMetaobject(child)
      if (title && url) {
        map.set(normalizeMeetLampStageTitle(title), url)
      }
    }
  }
  return map
}

/**
 * Resolve a video URL from flat file_reference (or URL string) fields on the parent metaobject.
 */
export function resolveVideoUrlForStageTitle(
  metaobject: Metaobject,
  title: string
): string | null {
  const slug = titleToSlugKey(title)
  const keys = [
    slug,
    `${slug}_video`,
    `video_${slug}`,
    `${slug}_file`,
    `file_${slug}`,
    `${slug}_clip`,
  ]
  for (const key of keys) {
    const u = getMetaobjectFileUrl(metaobject, key)
    if (u) return u
    const v = getMetaobjectField(metaobject, key)
    if (v?.trim().startsWith('http')) return v.trim()
  }
  for (const f of metaobject.fields) {
    if (!f.key.toLowerCase().includes(slug)) continue
    const u = getMetaobjectFileUrl(metaobject, f.key)
    if (u) return u
  }
  return null
}

export async function fetchMeetTheStreetLampVideoUrls(): Promise<{
  byNormalizedTitle: Map<string, string>
  parentMetaobject: Metaobject | null
}> {
  const type =
    process.env.SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE?.trim() || DEFAULT_METAOBJECT_TYPE
  const handle =
    process.env.SHOPIFY_UNDER_THE_FOLD_METAOBJECT_HANDLE?.trim() ||
    DEFAULT_METAOBJECT_HANDLE

  try {
    const data = await storefrontQuery<{ metaobject: MetaobjectWithRefLists | null }>(
      MEET_THE_FOLD_QUERY,
      { type, handle }
    )
    const mo = data.metaobject
    if (!mo) {
      console.warn(
        `[MeetTheStreetLamp] No metaobject type="${type}" handle="${handle}". Using static fallbacks.`
      )
      return { byNormalizedTitle: new Map(), parentMetaobject: null }
    }

    const byNormalizedTitle = collectNestedTitleVideoMap(mo)
    const parentMetaobject: Metaobject = {
      id: mo.id,
      type: mo.type,
      handle: mo.handle,
      fields: mo.fields,
    }

    console.log(
      `[MeetTheStreetLamp] Loaded under-the-fold metaobject "${mo.handle}" (${byNormalizedTitle.size} nested title→video map entries)`
    )

    return { byNormalizedTitle, parentMetaobject }
  } catch (e) {
    console.error('[MeetTheStreetLamp] Under-the-fold metaobject query failed:', e)
    return { byNormalizedTitle: new Map(), parentMetaobject: null }
  }
}

export type MeetTheLampStageInput = { title: string; description: string }

export type MeetTheLampStageWithVideo = MeetTheLampStageInput & { videoUrl?: string }

export function mergeMeetTheLampStagesWithShopifyVideos(
  stages: readonly MeetTheLampStageInput[],
  byNormalizedTitle: Map<string, string>,
  parentMetaobject: Metaobject | null
): MeetTheLampStageWithVideo[] {
  return stages.map((s) => {
    const key = normalizeMeetLampStageTitle(s.title)
    const fromNested = byNormalizedTitle.get(key)
    const fromFlat = parentMetaobject
      ? resolveVideoUrlForStageTitle(parentMetaobject, s.title)
      : null
    const videoUrl = fromNested || fromFlat
    return videoUrl ? { ...s, videoUrl } : { ...s }
  })
}
