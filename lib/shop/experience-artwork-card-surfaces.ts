import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const BG_EASE = 'duration-200 ease-out'

/** 2-up row / merge container (picker + strip). */
export const experienceArtistRowMergeClass = cn(
  'transition-[background-color]',
  BG_EASE,
  'bg-experience-surface-2'
)

export const experienceArtistRowDefaultClass = cn(
  'transition-[background-color]',
  BG_EASE,
  'bg-background'
)

export type PickerArtworkCardSurfaces = {
  shell: string
  imageWell: string
  meta: string
}

/** Picker sheet card: one source for shell / image well / footer meta backgrounds. */
export function getPickerArtworkCardSurfaces(_isSelected: boolean): PickerArtworkCardSurfaces {
  const t = `transition-[background-color] ${BG_EASE}`
  const tm = `transition-[background-color,color] ${BG_EASE}`
  return {
    shell: t,
    imageWell: cn(t, 'bg-background'),
    meta: cn(tm, 'bg-background'),
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

/** Picker cards no longer use per-card selection chrome; in-cart state is shown on the quick-add FAB only. */
export function getPickerCardSelectionChrome(_isSelected: boolean, _suppressIndividualRing: boolean): string {
  return ''
}

/** 28px touch target — compact quick-add FAB on picker / artist-works cards. */
export const experienceQuickAddFabSizeClass = 'h-7 w-7'

/** Icon size paired with `experienceQuickAddFabSizeClass`. */
export const experienceQuickAddFabIconClass = 'h-3 w-3'

/**
 * Brand peach quick-add FAB — literal #FFBA94 tokens (same as ExperienceV3 add CTAs).
 * Do not use `bg-experience-highlight` here: `lib/` is outside Tailwind `content` paths.
 */
export function getExperienceQuickAddFabClass(isInCart: boolean): string {
  return cn(
    'flex items-center justify-center rounded-full border shadow-md transition-colors',
    experienceQuickAddFabSizeClass,
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBA94]/70',
    isInCart
      ? 'border-[#FFBA94]/35 bg-[#FFBA94] text-neutral-900 cursor-default shadow-black/25'
      : 'border-[#FFBA94]/35 bg-[#FFBA94] text-neutral-900 hover:bg-[#ffc9a8] shadow-black/25'
  )
}

/** Previewing on main stage but not in cart — inset only (no outer ring / offset). */
export function getPickerCardPreviewChrome(isPreviewActive: boolean, isInCart: boolean): string {
  if (!isPreviewActive || isInCart) return ''
  return 'ring-1 ring-inset ring-[#FFBA94]/50 dark:ring-[#FFBA94]/35'
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
      shell: cn(tShell, 'bg-experience-surface-2'),
      imageWell: cn(tImg, 'bg-experience-surface-2'),
      meta: cn(tm, 'bg-experience-surface-2'),
      metaStyle: undefined,
    }
  }
  if (isInCart) {
    return {
      shell: cn(tShell, 'bg-[#e8f4ff] dark:bg-[#1a1616]'),
      imageWell: cn(tImg, 'bg-experience-surface-2'),
      meta: cn(tm, 'bg-[#e8f4ff]/95 dark:bg-[#1a1616]/80 backdrop-blur-xl backdrop-saturate-150'),
      metaStyle: metaBlur,
    }
  }
  return {
    shell: tShell,
    imageWell: cn(tImg, 'bg-muted dark:bg-experience-surface-2'),
    meta: cn(tm, 'bg-card/60 dark:bg-experience-surface-2/80 backdrop-blur-xl backdrop-saturate-150'),
    metaStyle: metaBlur,
  }
}
