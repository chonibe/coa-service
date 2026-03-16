export interface AdPreset {
  /** Display name shown in the bundle UI */
  name: string
  /** Shopify product handles for the featured artworks */
  handles: string[]
}

/**
 * Named ad presets — keyed by the ?preset= URL param value.
 * Add new campaign presets here without changing ad URLs.
 */
export const AD_PRESETS: Record<string, AdPreset> = {
  'feels-good-bundle': {
    name: 'Fortune Favours the Friendly',
    handles: ['fortune-favours-the-friendly', 'levinski', 'lamp-2'],
  },
}

export function getAdPreset(key: string | undefined): AdPreset | null {
  if (!key) return null
  return AD_PRESETS[key] ?? null
}
