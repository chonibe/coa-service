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
    // Dark + selected: no full shell tint — image well uses base + bottom-half overlay in the component.
    shell: cn(t, isSelected && 'bg-[#f0f9ff] dark:bg-transparent'),
    imageWell: cn(
      t,
      isSelected ? 'bg-[#f0f9ff] dark:bg-[#171515]' : 'bg-white dark:bg-[#171515]'
    ),
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
 * Configurator strip card: shell (incl. peach ring when in cart), image well, meta bar.
 * `isMerged` = in cart + spine pair + both sides selected styling (#f0f9ff / #2c2828).
 */
export function getStripArtworkCardSurfaces(isMerged: boolean, isInCart: boolean): StripArtworkCardSurfaces {
  const tImg = `transition-[background-color] ${BG_EASE}`
  const tShell = `transition-[background-color,border-color,box-shadow] ${BG_EASE}`
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
      shell: cn(
        tShell,
        'bg-[#e8f4ff] dark:bg-[#1a1616]',
        'border-[#FFBA94]/45 shadow-[inset_0_0_12px_rgba(255,186,148,0.1)]'
      ),
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
