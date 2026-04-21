/**
 * Vertical space taken by fixed `CollectorStoreTopChrome` (trust strip + nav + safe area).
 * Keep in sync with `components/shop/CollectorStoreTopChrome.tsx`.
 */
export const collectorStoreChromePaddingTopClass =
  'pt-[calc(6.25rem+env(safe-area-inset-top,0px))] md:pt-[calc(6.75rem+env(safe-area-inset-top,0px))]'

/** Same offset as empty block height (e.g. PDP spacer below fixed chrome). */
export const collectorStoreChromeSpacerHeightClass =
  'h-[calc(6.25rem+env(safe-area-inset-top,0px))] md:h-[calc(6.75rem+env(safe-area-inset-top,0px))]'
