import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const BG_EASE = 'duration-200 ease-out'

/** 2-up row / merge container (picker + strip). */
export const experienceArtistRowMergeClass = cn(
  'transition-[background-color]',
  BG_EASE,
  'bg-[#f0f9ff] dark:bg-[#2c2828]'
)

export const experienceArtistRowDefaultClass = cn(
  'transition-[background-color]',
  BG_EASE,
  'bg-white dark:bg-[#171515]'
)

export type PickerArtworkCardSurfaces = {
  shell: string
  imageWell: string
  meta: string
}

/** Picker sheet card: one source for shell / image well / footer meta backgrounds. */
export function getPickerArtworkCardSurfaces(isSelected: boolean): PickerArtworkCardSurfaces {
  const t = `transition-[background-color] ${BG_EASE}`
  const tm = `transition-[background-color,color] ${BG_EASE}`
  return {
    // Selected: same tint on shell + well + meta so no horizontal “seam” next to the full-card ring.
    shell: cn(t, isSelected && 'bg-[#f0f9ff] dark:bg-[#2c2828]'),
    imageWell: cn(t, isSelected ? 'bg-[#f0f9ff] dark:bg-[#2c2828]' : 'bg-white dark:bg-[#171515]'),
    meta: cn(tm, isSelected ? 'bg-[#f0f9ff] dark:bg-[#2c2828]' : 'bg-white dark:bg-[#171515]'),
  }
}

export type StripArtworkCardSurfaces = {
  shell: string
  imageWell: string
  meta: string
  metaStyle: CSSProperties | undefined
}

/**
 * Configurator strip card: shell, image well, meta bar (no outer border).
 * `isMerged` = in cart + spine pair + both sides selected styling (#f0f9ff / #2c2828).
 */

/** Subtle inset ring on one card. `suppressIndividualRing` = both sides of a 2-up row selected (merged tint only). */
export function getPickerCardSelectionChrome(isSelected: boolean, suppressIndividualRing: boolean): string {
  if (!isSelected || suppressIndividualRing) return ''
  return 'ring-1 ring-inset ring-[#FFBA94]/40 dark:ring-[#FFBA94]/30'
}

/** Strip: same as picker — thin ring unless merged pair (both in cart) uses row tint only. */
export function getStripCardSelectionChrome(isInCart: boolean, suppressIndividualRing: boolean): string {
  if (!isInCart || suppressIndividualRing) return ''
  return 'ring-1 ring-inset ring-[#FFBA94]/40 dark:ring-[#FFBA94]/30'
}

export function getStripArtworkCardSurfaces(isMerged: boolean, isInCart: boolean): StripArtworkCardSurfaces {
  const tImg = `transition-[background-color] ${BG_EASE}`
  const tShell = `transition-[background-color] ${BG_EASE}`
  const tm = `transition-[background-color,color] ${BG_EASE}`
  const metaBlur: CSSProperties = {
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  }

  if (isMerged) {
    return {
      shell: cn(tShell, 'bg-[#f0f9ff] dark:bg-[#2c2828]'),
      imageWell: cn(tImg, 'bg-[#f0f9ff] dark:bg-[#2c2828]'),
      meta: cn(tm, 'bg-[#f0f9ff] dark:bg-[#2c2828]'),
      metaStyle: undefined,
    }
  }
  if (isInCart) {
    return {
      shell: cn(tShell, 'bg-[#e8f4ff] dark:bg-[#1a1616]'),
      imageWell: cn(tImg, 'bg-[#e8f4ff] dark:bg-[#171515]'),
      meta: cn(tm, 'bg-[#e8f4ff]/95 dark:bg-[#1a1616]/80 backdrop-blur-xl backdrop-saturate-150'),
      metaStyle: metaBlur,
    }
  }
  return {
    shell: tShell,
    imageWell: cn(tImg, 'bg-neutral-100 dark:bg-[#201c1c]'),
    meta: cn(tm, 'bg-white/60 dark:bg-[#201c1c]/80 backdrop-blur-xl backdrop-saturate-150'),
    metaStyle: metaBlur,
  }
}
