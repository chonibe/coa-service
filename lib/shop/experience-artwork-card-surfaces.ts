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

const pickerSelectedPressedClass =
  'shadow-inner ring-1 ring-inset ring-black/[0.06] dark:ring-white/10'

/** Picker sheet card: one source for shell / image well / footer meta backgrounds. */
export function getPickerArtworkCardSurfaces(isSelected: boolean): PickerArtworkCardSurfaces {
  const t = `transition-[background-color,box-shadow] ${BG_EASE}`
  const tm = `transition-[background-color,color,box-shadow] ${BG_EASE}`
  if (isSelected) {
    return {
      shell: cn(t, pickerSelectedPressedClass, 'bg-card dark:bg-background'),
      imageWell: cn(t, 'bg-muted/40 dark:bg-experience-surface-2/90'),
      meta: cn(tm, 'bg-card dark:bg-background'),
    }
  }
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

/** 20px touch target — compact, low-profile quick-add FAB on picker / artist-works cards. */
export const experienceQuickAddFabSizeClass = 'h-5 w-5'

/** Icon size paired with `experienceQuickAddFabSizeClass` — inherits FAB text color (CTA red by default). */
export const experienceQuickAddFabIconClass = 'h-[9px] w-[9px] shrink-0 text-current'

/** Quick-add FAB — semi-solid surface, CTA icon; in-cart uses accent ring + check without loud fill. */
export function getExperienceQuickAddFabClass(isInCart: boolean): string {
  const base = cn(
    'flex items-center justify-center rounded-full border transition-[background-color,box-shadow,border-color,color] duration-150',
    experienceQuickAddFabSizeClass,
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-experience-cta/30 focus-visible:ring-offset-1 focus-visible:ring-offset-background'
  )

  if (isInCart) {
    return cn(
      base,
      'cursor-pointer',
      'bg-white text-experience-cta border-experience-cta/30 shadow-sm ring-1 ring-experience-cta/25',
      'hover:bg-experience-cta/5 hover:border-experience-cta/40 hover:ring-experience-cta/35',
      'dark:bg-card dark:text-experience-cta dark:border-experience-cta/35 dark:shadow-sm dark:ring-experience-cta/30',
      'dark:hover:bg-experience-cta/10 dark:hover:border-experience-cta/45'
    )
  }

  return cn(
    base,
    'bg-white text-experience-cta border-border/55 shadow-sm',
    'hover:border-border/75 hover:shadow',
    'dark:bg-card dark:text-experience-cta dark:border-border/45 dark:shadow-sm',
    'dark:hover:bg-muted/50 dark:hover:border-border/60'
  )
}

/** Previewing on main stage but not in cart — inset only (no outer ring / offset). */
export function getPickerCardPreviewChrome(isPreviewActive: boolean, isInCart: boolean): string {
  if (!isPreviewActive || isInCart) return ''
  return 'ring-1 ring-inset ring-experience-cta/50'
}

/** Strip: same as picker — thin ring unless merged pair (both in cart) uses row tint only. */
export function getStripCardSelectionChrome(isInCart: boolean, suppressIndividualRing: boolean): string {
  if (!isInCart || suppressIndividualRing) return ''
  return 'ring-1 ring-inset ring-experience-cta/40'
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
