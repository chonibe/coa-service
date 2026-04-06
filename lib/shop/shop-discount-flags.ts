/**
 * Global shop discount toggles stored in `system_settings` under {@link SHOP_DISCOUNT_FLAGS_KEY}.
 * Registry drives the admin UI; merge with DB values at runtime.
 */

export const SHOP_DISCOUNT_FLAGS_KEY = 'shop_discount_flags'

/** Supported flag keys (extend when adding new toggles). */
export type ShopDiscountFlagId = 'lampArtworkVolume'

export type ShopDiscountFlags = Record<ShopDiscountFlagId, boolean>

export const DEFAULT_SHOP_DISCOUNT_FLAGS: ShopDiscountFlags = {
  lampArtworkVolume: false,
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

/** Normalize JSON from DB (string or object). */
export function parseStoredShopDiscountFlags(raw: unknown): Partial<ShopDiscountFlags> | null {
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
  const out: Partial<ShopDiscountFlags> = {}
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (!isFlagId(k)) continue
    if (typeof v === 'boolean') out[k] = v
  }
  return Object.keys(out).length ? out : null
}

export function mergeShopDiscountFlagsWithDefaults(
  stored: Partial<ShopDiscountFlags> | null | undefined
): ShopDiscountFlags {
  return {
    ...DEFAULT_SHOP_DISCOUNT_FLAGS,
    ...(stored ?? {}),
  }
}

/** Apply only known keys from a PATCH body; ignores unknown fields. */
export function pickShopDiscountFlagUpdates(body: unknown): Partial<ShopDiscountFlags> | null {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return null
  const out: Partial<ShopDiscountFlags> = {}
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (!isFlagId(k)) continue
    if (typeof v === 'boolean') out[k] = v
  }
  return Object.keys(out).length ? out : null
}
