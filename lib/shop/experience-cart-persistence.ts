/**
 * Shared localStorage shape for /shop/experience and experience-v2 cart + lamp preview.
 * cartVersion 2: migrate lampQuantity 0 → 1 (lamp always included by default).
 */
export const EXPERIENCE_CART_STORAGE_KEY = 'sc-experience-cart-v2'

const CART_VERSION = 2

export type ExperienceCartSnapshot = {
  cartOrder: string[]
  lampQuantity: number
  lampPreviewOrder: string[]
}

export function loadExperienceCart(): ExperienceCartSnapshot {
  if (typeof window === 'undefined') {
    return { cartOrder: [], lampQuantity: 1, lampPreviewOrder: [] }
  }
  try {
    const raw = localStorage.getItem(EXPERIENCE_CART_STORAGE_KEY)
    if (!raw) return { cartOrder: [], lampQuantity: 1, lampPreviewOrder: [] }
    const p = JSON.parse(raw) as Record<string, unknown>
    const cart = Array.isArray(p.cartOrder) ? (p.cartOrder as string[]) : []
    const hasLampPreviewKey = Object.prototype.hasOwnProperty.call(p, 'lampPreviewOrder')
    const lampPreviewOrder = (() => {
      if (hasLampPreviewKey && Array.isArray(p.lampPreviewOrder)) {
        return (p.lampPreviewOrder as string[]).filter((id: string) => cart.includes(id)).slice(0, 2)
      }
      return cart.length > 0 ? cart.slice(0, 2) : []
    })()

    let lampQuantity =
      typeof p.lampQuantity === 'number' && p.lampQuantity >= 0 ? p.lampQuantity : 1
    const storedVersion = typeof p.cartVersion === 'number' ? p.cartVersion : 1
    if (storedVersion < CART_VERSION && lampQuantity === 0) {
      lampQuantity = 1
    }

    return {
      cartOrder: cart,
      lampQuantity,
      lampPreviewOrder,
    }
  } catch {
    return { cartOrder: [], lampQuantity: 1, lampPreviewOrder: [] }
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
