/**
 * Maps Shopify metaobject entries (Meet-the-Lamp “under the fold” clips) to carousel slides
 * by title / handle so each stage can use its own video.
 *
 * The Storefront API `metaobjects(type: …)` value must match your **definition** handle (Admin → Content →
 * Metaobjects shows it in the URL, e.g. `.../entries/under_the_fold_section/...` → type `under_the_fold_section`).
 * Override with `SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE` if yours differs.
 */

import {
  getMetaobjectField,
  getMetaobjectFileUrl,
  getVideoUrlFromMetaobjectField,
  listMetaobjectsWithReferences,
  type Metaobject,
} from './metaobjects'

/** Definition handle used in `metaobjects(type: …)` — matches Admin metaobject entries path segment. */
export const UNDER_THE_FOLD_METAOBJECT_TYPE =
  process.env.SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE?.trim() ||
  'under_the_fold_section'

const TITLE_FIELD_KEYS = [
  'title',
  'heading',
  'name',
  'section_title',
  'subtitle',
  'slide_title',
  'stage_title',
  'headline',
  'label',
] as const

const DESKTOP_VIDEO_FIELD_KEYS = [
  'video',
  'desktop_video',
  'section_video',
  'section_video_file',
  'video_file',
  'hero_video',
  'media',
  'file',
] as const

const MOBILE_VIDEO_FIELD_KEYS = ['mobile_video', 'video_mobile'] as const

const POSTER_FIELD_KEYS = [
  'poster',
  'thumbnail',
  'video_poster',
  'image',
] as const

export type MeetTheLampStageVideoEntry = {
  desktopVideo?: string
  mobileVideo?: string
  poster?: string
}

export function normalizeMeetTheLampTitleKey(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Slug-style key for matching metaobject handles (e.g. "Set the light" → "set-the-light"). */
export function meetTheLampTitleToHandleKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function firstNonEmptyTextField(
  metaobject: Metaobject,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const v = getMetaobjectField(metaobject, key)
    if (v?.trim()) return v.trim()
  }
  return null
}

function firstFileUrlFromKeys(
  metaobject: Metaobject,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const u = getMetaobjectFileUrl(metaobject, key)
    if (u) return u
  }
  return null
}

/** Prefer named video fields, then any field that resolves to a video (Video ref, GenericFile .mp4, URL text). */
function firstVideoUrlFromMetaobject(metaobject: Metaobject): string | null {
  const named = firstFileUrlFromKeys(metaobject, DESKTOP_VIDEO_FIELD_KEYS)
  if (named && (isVideoLikeUrl(named) || !looksLikeImageUrl(named))) return named

  for (const field of metaobject.fields) {
    const u = getVideoUrlFromMetaobjectField(field)
    if (u) return u
  }
  return null
}

function isVideoLikeUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
}

function looksLikeImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(url)
}

function firstPosterUrlFromMetaobject(metaobject: Metaobject): string | null {
  const named = firstFileUrlFromKeys(metaobject, POSTER_FIELD_KEYS)
  if (named) return named
  for (const field of metaobject.fields) {
    const ref = field.reference
    if (ref?.image?.url) return ref.image.url
    const v = field.value?.trim()
    if (v && looksLikeImageUrl(v) && /^https?:\/\//i.test(v)) return v
  }
  return null
}

/**
 * Build a lookup map: normalized title, slug from title, handle variants → video URLs.
 */
export async function fetchMeetTheLampStageVideosFromShopify(): Promise<
  Map<string, MeetTheLampStageVideoEntry>
> {
  const map = new Map<string, MeetTheLampStageVideoEntry>()
  const items = await listMetaobjectsWithReferences(
    UNDER_THE_FOLD_METAOBJECT_TYPE,
    50
  )

  if (process.env.NODE_ENV === 'development') {
    if (items.length === 0) {
      console.warn(
        `[under-the-fold] No metaobjects for type "${UNDER_THE_FOLD_METAOBJECT_TYPE}". Check definition handle matches Admin (e.g. under_the_fold_section), Storefront API scope unauthenticated_read_metaobjects, and that entries are published to the online store.`
      )
    }
  }

  for (const mo of items) {
    const title = firstNonEmptyTextField(mo, TITLE_FIELD_KEYS)
    const desktopVideo = firstVideoUrlFromMetaobject(mo) || undefined
    const rawMobile = firstFileUrlFromKeys(mo, MOBILE_VIDEO_FIELD_KEYS)
    const mobileFromField =
      rawMobile && (isVideoLikeUrl(rawMobile) || !looksLikeImageUrl(rawMobile))
        ? rawMobile
        : undefined
    const mobileVideo = mobileFromField || desktopVideo
    const poster = firstPosterUrlFromMetaobject(mo) || undefined

    if (process.env.NODE_ENV === 'development' && items.length > 0 && !desktopVideo) {
      console.warn(
        `[under-the-fold] Entry handle="${mo.handle}" has no extractable video. Field keys:`,
        mo.fields.map((f) => `${f.key}(${f.type})`).join(', ')
      )
    }

    if (!desktopVideo && !mobileVideo) continue

    const entry: MeetTheLampStageVideoEntry = {
      ...(desktopVideo ? { desktopVideo } : {}),
      ...(mobileVideo ? { mobileVideo } : {}),
      ...(poster ? { poster } : {}),
    }

    const register = (key: string) => {
      if (!key) return
      map.set(key, entry)
    }

    if (title) {
      register(normalizeMeetTheLampTitleKey(title))
      register(meetTheLampTitleToHandleKey(title))
    }

    const handle = mo.handle?.trim()
    if (handle) {
      register(handle)
      register(normalizeMeetTheLampTitleKey(handle.replace(/[-_]+/g, ' ')))
      register(meetTheLampTitleToHandleKey(handle.replace(/_/g, '-')))
    }
  }

  return map
}

export function mergeMeetTheLampStagesWithUnderTheFoldVideos<
  T extends { title: string; description: string },
>(
  stages: readonly T[],
  videoMap: Map<string, MeetTheLampStageVideoEntry>
): Array<
  T & {
    desktopVideo?: string
    mobileVideo?: string
    poster?: string
  }
> {
  return stages.map((s) => {
    const byTitle = videoMap.get(normalizeMeetTheLampTitleKey(s.title))
    const bySlug = videoMap.get(meetTheLampTitleToHandleKey(s.title))
    const hit = byTitle ?? bySlug
    if (!hit) return { ...s }
    return {
      ...s,
      ...(hit.desktopVideo ? { desktopVideo: hit.desktopVideo } : {}),
      ...(hit.mobileVideo ? { mobileVideo: hit.mobileVideo } : {}),
      ...(hit.poster ? { poster: hit.poster } : {}),
    }
  })
}
