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
  // Ad URL variants — typo in original campaign URL preserved intentionally
  'fortune-favores-the-friendly': {
    name: 'Fortune Favours the Friendly',
    handles: ['fortune-favours-the-friendly', 'levinski', 'lamp-2'],
  },
  'fortune-favours-the-friendly': {
    name: 'Fortune Favours the Friendly',
    handles: ['fortune-favours-the-friendly', 'levinski', 'lamp-2'],
  },
}

/** Alternate Shopify handles per preset handle (e.g. US vs UK spelling) so the product is found. */
export const PRESET_ALT_HANDLES: Record<string, string[]> = {
  'fortune-favours-the-friendly': ['fortune-favors-the-friendly', 'fortune-favours-the-friendly-by-mysunbeam'],
}

export function getAdPreset(key: string | undefined): AdPreset | null {
  if (!key) return null
  return AD_PRESETS[key] ?? null
}

/** All handles to request for a preset (primary + alternates) so fetch returns the products. */
export function getPresetFetchHandles(preset: AdPreset): string[] {
  const out: string[] = []
  for (const h of preset.handles) {
    out.push(h)
    for (const alt of PRESET_ALT_HANDLES[h] ?? []) {
      if (!out.includes(alt)) out.push(alt)
    }
  }
  return out
}

/** Resolve ordered products for a preset from a list, matching each slot by primary or alternate handle. */
export function resolvePresetProducts<T extends { id: string; handle: string }>(
  preset: AdPreset,
  products: T[]
): T[] {
  const result: T[] = []
  const usedIds = new Set<string>()
  for (const handle of preset.handles) {
    const alts = [handle, ...(PRESET_ALT_HANDLES[handle] ?? [])]
    const p = products.find((x) => alts.includes(x.handle) && !usedIds.has(x.id))
    if (p) {
      result.push(p)
      usedIds.add(p.id)
    }
  }
  return result
}
