/**
 * Shared image position defaults and persistence for the lamp experience configurator.
 * Used by Configurator, Spline3DPreview, and template-preview so positions stay in sync.
 */

export const IMAGE_POSITION_KEY = 'sc-experience-image-position'

export type SidePosition = {
  scale: number
  offsetX: number
  offsetY: number
  scaleX: number
  scaleY: number
}

/** Default position for Side A. Matches what preview renders. */
export const DEFAULT_SIDE_POSITION: SidePosition = {
  scale: 1,
  offsetX: -0.02,
  offsetY: -0.02,
  scaleX: 0.96,
  scaleY: 0.96,
}

/** Default position for Side B (X offset aligned with Side A). */
export const DEFAULT_SIDE_B_POSITION: SidePosition = {
  ...DEFAULT_SIDE_POSITION,
  offsetX: 0.017,
}

export type SavedPosition = {
  sideA: SidePosition
  sideB: SidePosition
}

function parseSide(s: Record<string, unknown> | undefined, fallback: SidePosition): SidePosition {
  if (!s || typeof s !== 'object') return fallback
  return {
    scale: typeof s.scale === 'number' ? s.scale : fallback.scale,
    offsetX: typeof s.offsetX === 'number' ? s.offsetX : fallback.offsetX,
    offsetY: typeof s.offsetY === 'number' ? s.offsetY : fallback.offsetY,
    scaleX: typeof s.scaleX === 'number' ? s.scaleX : fallback.scaleX,
    scaleY: typeof s.scaleY === 'number' ? s.scaleY : fallback.scaleY,
  }
}

/** Load saved positions from localStorage. Handles legacy flat format. */
export function loadImagePosition(): SavedPosition | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(IMAGE_POSITION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const sideA = parseSide(parsed.sideA ?? parsed, DEFAULT_SIDE_POSITION)
    const sideB = parseSide(parsed.sideB as Record<string, unknown> | undefined, DEFAULT_SIDE_B_POSITION)
    return { sideA, sideB }
  } catch {
    return null
  }
}

/** Save positions to localStorage. */
export function saveImagePosition(position: SavedPosition): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(IMAGE_POSITION_KEY, JSON.stringify(position))
  } catch {
    // Ignore
  }
}
