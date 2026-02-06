/**
 * Homepage Settings from Shopify Metaobjects
 * 
 * Fetches dynamic homepage content from Shopify metaobjects.
 * This allows you to edit homepage content directly in Shopify Admin.
 */

import { getMetaobject, getMetaobjectField, getMetaobjectFileUrl, parseMetaobjectJSON } from './metaobjects'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface HomepageVideoSettings {
  url: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  poster?: string
}

export interface HomepageHeroSettings {
  video: HomepageVideoSettings
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaUrl?: string
  textColor?: string
  overlayColor?: string
  overlayOpacity?: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Metaobject type and handle for homepage banner video
// Note: The handle is the URL-friendly version of the display name
// Display name: "Video Banner Hero" → Handle: "video-banner-hero"
const METAOBJECT_TYPE = 'homepage_banner_video'
const METAOBJECT_HANDLE = 'homepage-banner-video-3gqrnjc3' // Exact handle from Shopify (includes ID)

// Field keys in the metaobject
// NOTE: video_banner_hero and video_banner_1 are file_reference types, not direct URLs
const FIELD_KEYS = {
  VIDEO_BANNER_HERO: 'video_banner_hero', // Primary video (file_reference)
  VIDEO_BANNER_1: 'video_banner_1',       // Secondary video (file_reference)
  VIDEO_URL: 'video_url',                 // Direct URL (if added later)
  VIDEO_POSTER: 'video_poster',           // Poster image (file_reference or URL)
  AUTOPLAY: 'autoplay',
  LOOP: 'loop',
  MUTED: 'muted',
  HEADLINE: 'headline',
  SUBHEADLINE: 'subheadline',
  CTA_TEXT: 'cta_text',
  CTA_URL: 'cta_url',
  TEXT_COLOR: 'text_color',
  OVERLAY_COLOR: 'overlay_color',
  OVERLAY_OPACITY: 'overlay_opacity',
} as const

// =============================================================================
// FETCH FUNCTIONS
// =============================================================================

/**
 * Fetch hero video URL from Shopify metaobject
 */
export async function getHeroVideoUrl(): Promise<string | null> {
  const metaobject = await getMetaobject(METAOBJECT_TYPE, METAOBJECT_HANDLE)
  return getMetaobjectField(metaobject, FIELD_KEYS.VIDEO_URL)
}

/**
 * Fetch hero video settings from Shopify metaobject
 */
export async function getHeroVideoSettings(): Promise<HomepageVideoSettings | null> {
  const metaobject = await getMetaobject(METAOBJECT_TYPE, METAOBJECT_HANDLE)
  
  if (!metaobject) return null

  // Try to get video URL from file reference first (video_banner_hero)
  let url = getMetaobjectFileUrl(metaobject, FIELD_KEYS.VIDEO_BANNER_HERO)
  
  // Fallback to direct URL field if file reference not found
  if (!url) {
    url = getMetaobjectField(metaobject, FIELD_KEYS.VIDEO_URL)
  }
  
  // If still no URL, try secondary video
  if (!url) {
    url = getMetaobjectFileUrl(metaobject, FIELD_KEYS.VIDEO_BANNER_1)
  }
  
  if (!url) {
    console.warn('[Homepage Settings] No video URL found in metaobject')
    return null
  }

  console.log(`[Homepage Settings] ✅ Found video URL from metaobject: ${url}`)

  // Get poster from file reference or direct URL
  const poster = getMetaobjectFileUrl(metaobject, FIELD_KEYS.VIDEO_POSTER) || 
                 getMetaobjectField(metaobject, FIELD_KEYS.VIDEO_POSTER)
  
  const autoplay = getMetaobjectField(metaobject, FIELD_KEYS.AUTOPLAY)
  const loop = getMetaobjectField(metaobject, FIELD_KEYS.LOOP)
  const muted = getMetaobjectField(metaobject, FIELD_KEYS.MUTED)

  return {
    url,
    poster: poster || undefined,
    autoplay: autoplay === 'true' || autoplay === '1' || autoplay === 'True',
    loop: loop === 'true' || loop === '1' || loop === 'True',
    muted: muted === 'true' || muted === '1' || muted === 'True',
  }
}

/**
 * Fetch complete hero section settings from Shopify metaobject
 */
export async function getHeroSettings(): Promise<HomepageHeroSettings | null> {
  const metaobject = await getMetaobject(METAOBJECT_TYPE, METAOBJECT_HANDLE)
  
  if (!metaobject) return null

  const videoSettings = await getHeroVideoSettings()
  if (!videoSettings) return null

  const headline = getMetaobjectField(metaobject, FIELD_KEYS.HEADLINE)
  const subheadline = getMetaobjectField(metaobject, FIELD_KEYS.SUBHEADLINE)
  const ctaText = getMetaobjectField(metaobject, FIELD_KEYS.CTA_TEXT)
  const ctaUrl = getMetaobjectField(metaobject, FIELD_KEYS.CTA_URL)
  const textColor = getMetaobjectField(metaobject, FIELD_KEYS.TEXT_COLOR)
  const overlayColor = getMetaobjectField(metaobject, FIELD_KEYS.OVERLAY_COLOR)
  const overlayOpacity = getMetaobjectField(metaobject, FIELD_KEYS.OVERLAY_OPACITY)

  return {
    video: videoSettings,
    headline: headline || undefined,
    subheadline: subheadline || undefined,
    ctaText: ctaText || undefined,
    ctaUrl: ctaUrl || undefined,
    textColor: textColor || undefined,
    overlayColor: overlayColor || undefined,
    overlayOpacity: overlayOpacity ? parseInt(overlayOpacity) : undefined,
  }
}

/**
 * Fetch secondary video settings from Shopify metaobject
 * Uses video_banner_1 field as the secondary video
 */
export async function getSecondaryVideoSettings(): Promise<HomepageVideoSettings | null> {
  const metaobject = await getMetaobject(METAOBJECT_TYPE, METAOBJECT_HANDLE)
  
  if (!metaobject) return null

  // Get secondary video URL from video_banner_1 file reference
  const url = getMetaobjectFileUrl(metaobject, FIELD_KEYS.VIDEO_BANNER_1)
  
  if (!url) {
    console.warn('[Homepage Settings] No secondary video URL found in metaobject')
    return null
  }

  console.log(`[Homepage Settings] ✅ Found secondary video URL from metaobject: ${url}`)

  // Get poster from file reference or direct URL
  const poster = getMetaobjectFileUrl(metaobject, FIELD_KEYS.VIDEO_POSTER) || 
                 getMetaobjectField(metaobject, FIELD_KEYS.VIDEO_POSTER)
  
  const autoplay = getMetaobjectField(metaobject, FIELD_KEYS.AUTOPLAY)
  const loop = getMetaobjectField(metaobject, FIELD_KEYS.LOOP)
  const muted = getMetaobjectField(metaobject, FIELD_KEYS.MUTED)

  return {
    url,
    poster: poster || undefined,
    autoplay: autoplay === 'true' || autoplay === '1' || autoplay === 'True',
    loop: loop === 'true' || loop === '1' || loop === 'True',
    muted: muted === 'true' || muted === '1' || muted === 'True',
  }
}

// =============================================================================
// FALLBACK TO STATIC CONTENT
// =============================================================================

/**
 * Get hero settings with fallback to static content
 */
export async function getHeroSettingsWithFallback(
  fallback: HomepageHeroSettings
): Promise<HomepageHeroSettings> {
  try {
    console.log('[Homepage Settings] Fetching from metaobject...')
    const settings = await getHeroSettings()
    
    if (!settings) {
      console.log('[Homepage Settings] ⚠️ No metaobject found, using fallback content')
      console.log('[Homepage Settings] Fallback video URL:', fallback.video.url)
      return fallback
    }

    console.log('[Homepage Settings] ✅ Using metaobject video URL:', settings.video.url)

    // Merge with fallback for any missing values
    return {
      video: {
        url: settings.video.url,
        autoplay: settings.video.autoplay ?? fallback.video.autoplay,
        loop: settings.video.loop ?? fallback.video.loop,
        muted: settings.video.muted ?? fallback.video.muted,
        poster: settings.video.poster || fallback.video.poster,
      },
      headline: settings.headline || fallback.headline,
      subheadline: settings.subheadline || fallback.subheadline,
      ctaText: settings.ctaText || fallback.ctaText,
      ctaUrl: settings.ctaUrl || fallback.ctaUrl,
      textColor: settings.textColor || fallback.textColor,
      overlayColor: settings.overlayColor || fallback.overlayColor,
      overlayOpacity: settings.overlayOpacity ?? fallback.overlayOpacity,
    }
  } catch (error) {
    console.error('[Homepage Settings] Failed to fetch from Shopify, using fallback:', error)
    return fallback
  }
}

/**
 * Get secondary video settings with fallback to static content
 */
export async function getSecondaryVideoSettingsWithFallback(
  fallback: HomepageVideoSettings
): Promise<HomepageVideoSettings> {
  try {
    console.log('[Homepage Settings] Fetching secondary video from metaobject...')
    const settings = await getSecondaryVideoSettings()
    
    if (!settings) {
      console.log('[Homepage Settings] ⚠️ No secondary video found in metaobject, using fallback')
      console.log('[Homepage Settings] Fallback secondary video URL:', fallback.url)
      return fallback
    }

    console.log('[Homepage Settings] ✅ Using metaobject secondary video URL:', settings.url)

    // Merge with fallback for any missing values
    return {
      url: settings.url,
      autoplay: settings.autoplay ?? fallback.autoplay,
      loop: settings.loop ?? fallback.loop,
      muted: settings.muted ?? fallback.muted,
      poster: settings.poster || fallback.poster,
    }
  } catch (error: any) {
    console.error('[Homepage Settings] Failed to fetch secondary video settings:', error)
    return fallback
  }
}
