/**
 * Maps Shopify metaobject entries (Meet-the-Lamp “under the fold” clips) to carousel slides
 * by title / handle so each stage can use its own video.
 *
 * The Storefront API `metaobjects(type: …)` value must match your definition handle in Shopify
 * (e.g. `under-the-fold-section-gedomnm3`). Override with `SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE`.
 */

import {
  getMetaobjectField,
  getMetaobjectFileUrl,
  listMetaobjectsWithReferences,
  type Metaobject,
} from './metaobjects'

/** Definition handle used in `metaobjects(type: …)` — must match the store’s metaobject type. */
export const UNDER_THE_FOLD_METAOBJECT_TYPE =
  process.env.SHOPIFY_UNDER_THE_FOLD_METAOBJECT_TYPE?.trim() ||
  'under-the-fold-section-gedomnm3'

const TITLE_FIELD_KEYS = [
  'title',
  'heading',
  'name',
  'section_title',
  'subtitle',
] as const

const DESKTOP_VIDEO_FIELD_KEYS = [
  'video',
  'desktop_video',
  'section_video',
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

/**
 * Build a lookup map: normalized title, slug from title, handle variants → video URLs.
 */
export async function fetchMeetTheLampStageVideosFromShopify(): Promise<
  Map<string, MeetTheLampStageVideoEntry>
> {
  const map = new Map<string, MeetTheLampStageVideoEntry>()
  const items = await listMetaobjectsWithReferences(
    UNDER_THE_FOLD_METAOBJECT_TYPE,
    30
  )

  for (const mo of items) {
    const title = firstNonEmptyTextField(mo, TITLE_FIELD_KEYS)
    const desktopVideo =
      firstFileUrlFromKeys(mo, DESKTOP_VIDEO_FIELD_KEYS) || undefined
    const mobileFromField =
      firstFileUrlFromKeys(mo, MOBILE_VIDEO_FIELD_KEYS) || undefined
    const mobileVideo = mobileFromField || desktopVideo
    const poster = firstFileUrlFromKeys(mo, POSTER_FIELD_KEYS) || undefined

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
