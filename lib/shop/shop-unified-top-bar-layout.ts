/**
 * Vertical space for the unified shop top bar (`ShopUnifiedTopBar` / `ExperienceSlideoutMenu` header).
 * Matches `h-14 sm:h-16` + safe area.
 */
export const shopUnifiedTopBarPaddingTopClass =
  'pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4rem+env(safe-area-inset-top,0px))]'

export const shopUnifiedTopBarSpacerHeightClass =
  'h-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:h-[calc(4rem+env(safe-area-inset-top,0px))]'

/** Top offset for fixed panels/drawers that should sit below the unified shop top bar. */
export const shopUnifiedTopBarTopInsetClass =
  'top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))]'

/** Full height for right/left drawers below the unified shop top bar (stable, not content-driven). */
export const shopUnifiedTopBarDrawerHeightClass =
  'h-[calc(100dvh-env(safe-area-inset-top,0px)-3.5rem)] sm:h-[calc(100dvh-env(safe-area-inset-top,0px)-4rem)]'
