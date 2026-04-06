/**
 * Shared localStorage shape for /shop/experience and experience-v2 cart + lamp preview.
 * cartVersion 3: default **lampQuantity 0** — user adds the Street Lamp explicitly (no auto-add).
 * cartVersion 2 (legacy): previously migrated lampQuantity 0 → 1 on read; no longer applied.
 */
export const EXPERIENCE_CART_STORAGE_KEY = 'sc-experience-cart-v2'

const CART_VERSION = 3

export type ExperienceCartSnapshot = {
  cartOrder: string[]
  lampQuantity: number
  lampPreviewOrder: string[]
}

export function loadExperienceCart(): ExperienceCartSnapshot {
  if (typeof window === 'undefined') {
    return { cartOrder: [], lampQuantity: 0, lampPreviewOrder: [] }
  }
  try {
    const raw = localStorage.getItem(EXPERIENCE_CART_STORAGE_KEY)
    if (!raw) return { cartOrder: [], lampQuantity: 0, lampPreviewOrder: [] }
    const p = JSON.parse(raw) as Record<string, unknown>
    const cart = Array.isArray(p.cartOrder) ? (p.cartOrder as string[]) : []
    const hasLampPreviewKey = Object.prototype.hasOwnProperty.call(p, 'lampPreviewOrder')
    const lampPreviewOrder = (() => {
      if (hasLampPreviewKey && Array.isArray(p.lampPreviewOrder)) {
        return (p.lampPreviewOrder as string[]).filter((id: string) => cart.includes(id)).slice(0, 2)
      }
      return cart.length > 0 ? cart.slice(0, 2) : []
    })()

    const lampQuantity =
      typeof p.lampQuantity === 'number' && p.lampQuantity >= 0 ? p.lampQuantity : 0

    return {
      cartOrder: cart,
      lampQuantity,
      lampPreviewOrder,
    }
  } catch {
    return { cartOrder: [], lampQuantity: 0, lampPreviewOrder: [] }
  }
}

export function saveExperienceCart(
  cartOrder: string[],
  lampQuantity: number,
  lampPreviewOrder: string[]
) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      EXPERIENCE_CART_STORAGE_KEY,
      JSON.stringify({
        cartVersion: CART_VERSION,
        cartOrder,
        lampQuantity,
        lampPreviewOrder,
      })
    )
  } catch {
    // ignore
  }
}
