/**
 * Shop experience discount settings stored in `system_settings` under {@link SHOP_DISCOUNT_FLAGS_KEY}.
 * JSON may include boolean flags plus featured-bundle pricing fields.
 */

export const SHOP_DISCOUNT_FLAGS_KEY = 'shop_discount_flags'

/** Supported boolean flag keys (lamp ladder toggle). */
export type ShopDiscountFlagId = 'lampArtworkVolume'

export type ShopDiscountFlags = Record<ShopDiscountFlagId, boolean>

export const DEFAULT_SHOP_DISCOUNT_FLAGS: ShopDiscountFlags = {
  lampArtworkVolume: false,
}

/** How the spotlight “lamp + 2 prints” bundle price is computed vs regular subtotal for those three lines. */
export type FeaturedBundleDiscountMode = 'fixed_total' | 'percent_off' | 'amount_off'

export type FeaturedBundleDiscountSettings = {
  enabled: boolean
  mode: FeaturedBundleDiscountMode
  /** Meaning depends on mode: fixed_total = bundle USD; percent_off = 0–100 off regular; amount_off = USD off regular. */
  value: number
}

/** Default matches legacy hard-coded bundle before admin settings existed. */
export const DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS: FeaturedBundleDiscountSettings = {
  enabled: true,
  mode: 'fixed_total',
  value: 159,
}

export type ShopDiscountSettings = {
  flags: ShopDiscountFlags
  featuredBundle: FeaturedBundleDiscountSettings
}

export const DEFAULT_SHOP_DISCOUNT_SETTINGS: ShopDiscountSettings = {
  flags: DEFAULT_SHOP_DISCOUNT_FLAGS,
  featuredBundle: DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS,
}

export type ShopDiscountRegistryEntry = {
  id: ShopDiscountFlagId
  label: string
  description: string
  defaultEnabled: boolean
}

export const SHOP_DISCOUNT_REGISTRY: ShopDiscountRegistryEntry[] = [
  {
    id: 'lampArtworkVolume',
    label: 'Lamp volume discount (shop experience)',
    description:
      'When on, each artwork in the cart reduces the Street Lamp price on a ladder (7.5% per artwork, up to 100% off one lamp per 14 artworks). When off, each lamp bills at full price.',
    defaultEnabled: DEFAULT_SHOP_DISCOUNT_FLAGS.lampArtworkVolume,
  },
]

const FLAG_IDS = new Set<ShopDiscountFlagId>(SHOP_DISCOUNT_REGISTRY.map((r) => r.id))

function isFlagId(k: string): k is ShopDiscountFlagId {
  return FLAG_IDS.has(k as ShopDiscountFlagId)
}

const BUNDLE_MODES = new Set<FeaturedBundleDiscountMode>(['fixed_total', 'percent_off', 'amount_off'])

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function clampNonNeg(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

/**
 * Effective bundle total (lamp + two spotlight prints) from admin rules and the undiscounted total for those three lines.
 */
export function computeFeaturedBundleEffectiveUsd(
  regularLampPlusTwoArtsUsd: number,
  settings: FeaturedBundleDiscountSettings
): number {
  if (!settings.enabled) return regularLampPlusTwoArtsUsd
  const base = Math.max(0, regularLampPlusTwoArtsUsd)
  switch (settings.mode) {
    case 'fixed_total':
      return Math.max(0, settings.value)
    case 'percent_off': {
      const pct = clampPercent(settings.value)
      return Math.round(base * (1 - pct / 100) * 100) / 100
    }
    case 'amount_off':
      return Math.max(0, Math.round((base - clampNonNeg(settings.value)) * 100) / 100)
    default:
      return base
  }
}

/** Normalize JSON from DB (string or object). */
export function parseStoredShopDiscountSettings(raw: unknown): Partial<{
  lampArtworkVolume: boolean
  featuredBundleEnabled: boolean
  featuredBundleMode: FeaturedBundleDiscountMode
  featuredBundleValue: number
}> | null {
  if (raw == null) return null
  let obj: unknown = raw
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as unknown
    } catch {
      return null
    }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return null
  const rec = obj as Record<string, unknown>
  const out: Partial<{
    lampArtworkVolume: boolean
    featuredBundleEnabled: boolean
    featuredBundleMode: FeaturedBundleDiscountMode
    featuredBundleValue: number
  }> = {}

  if (typeof rec.lampArtworkVolume === 'boolean') out.lampArtworkVolume = rec.lampArtworkVolume

  if (typeof rec.featuredBundleEnabled === 'boolean') out.featuredBundleEnabled = rec.featuredBundleEnabled
  if (typeof rec.featuredBundleMode === 'string' && BUNDLE_MODES.has(rec.featuredBundleMode as FeaturedBundleDiscountMode)) {
    out.featuredBundleMode = rec.featuredBundleMode as FeaturedBundleDiscountMode
  }
  if (typeof rec.featuredBundleValue === 'number' && Number.isFinite(rec.featuredBundleValue)) {
    out.featuredBundleValue = rec.featuredBundleValue
  }

  return Object.keys(out).length ? out : null
}

/** @deprecated use parseStoredShopDiscountSettings */
export function parseStoredShopDiscountFlags(raw: unknown): Partial<ShopDiscountFlags> | null {
  const p = parseStoredShopDiscountSettings(raw)
  if (!p || p.lampArtworkVolume === undefined) return null
  return { lampArtworkVolume: p.lampArtworkVolume }
}

export function mergeShopDiscountSettingsWithDefaults(
  stored: Partial<{
    lampArtworkVolume: boolean
    featuredBundleEnabled: boolean
    featuredBundleMode: FeaturedBundleDiscountMode
    featuredBundleValue: number
  }> | null | undefined
): ShopDiscountSettings {
  const flags: ShopDiscountFlags = {
    ...DEFAULT_SHOP_DISCOUNT_FLAGS,
    ...(stored?.lampArtworkVolume !== undefined ? { lampArtworkVolume: stored.lampArtworkVolume } : {}),
  }
  const featuredBundle: FeaturedBundleDiscountSettings = {
    enabled:
      stored?.featuredBundleEnabled !== undefined
        ? stored.featuredBundleEnabled
        : DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS.enabled,
    mode: stored?.featuredBundleMode ?? DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS.mode,
    value:
      stored?.featuredBundleValue !== undefined
        ? stored.featuredBundleValue
        : DEFAULT_FEATURED_BUNDLE_DISCOUNT_SETTINGS.value,
  }
  return { flags, featuredBundle }
}

export function mergeShopDiscountFlagsWithDefaults(
  stored: Partial<ShopDiscountFlags> | null | undefined
): ShopDiscountFlags {
  return mergeShopDiscountSettingsWithDefaults(
    stored ? { lampArtworkVolume: stored.lampArtworkVolume } : null
  ).flags
}

/** Boolean-only PATCH keys (lamp). */
export function pickShopDiscountFlagUpdates(body: unknown): Partial<ShopDiscountFlags> | null {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return null
  const out: Partial<ShopDiscountFlags> = {}
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (!isFlagId(k)) continue
    if (typeof v === 'boolean') out[k] = v
  }
  return Object.keys(out).length ? out : null
}

/** Full settings PATCH: lamp boolean + optional bundle fields. */
export function pickShopDiscountSettingsUpdates(body: unknown): Partial<{
  lampArtworkVolume: boolean
  featuredBundleEnabled: boolean
  featuredBundleMode: FeaturedBundleDiscountMode
  featuredBundleValue: number
}> | null {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return null
  const rec = body as Record<string, unknown>
  const out: Partial<{
    lampArtworkVolume: boolean
    featuredBundleEnabled: boolean
    featuredBundleMode: FeaturedBundleDiscountMode
    featuredBundleValue: number
  }> = {}

  if (typeof rec.lampArtworkVolume === 'boolean') out.lampArtworkVolume = rec.lampArtworkVolume
  if (typeof rec.featuredBundleEnabled === 'boolean') out.featuredBundleEnabled = rec.featuredBundleEnabled
  if (typeof rec.featuredBundleMode === 'string' && BUNDLE_MODES.has(rec.featuredBundleMode as FeaturedBundleDiscountMode)) {
    out.featuredBundleMode = rec.featuredBundleMode as FeaturedBundleDiscountMode
  }
  if (typeof rec.featuredBundleValue === 'number' && Number.isFinite(rec.featuredBundleValue)) {
    out.featuredBundleValue = rec.featuredBundleValue
  }

  return Object.keys(out).length ? out : null
}
