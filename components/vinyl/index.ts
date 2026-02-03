/**
 * Vinyl Components
 * 
 * A collection of components for vinyl record-inspired artwork interactions.
 * Transform the browsing experience to feel like flipping through a crate
 * of vinyl records at a record store.
 * 
 * @example
 * ```tsx
 * import { 
 *   VinylArtworkCard, 
 *   VinylCrateBrowser,
 *   VinylTurntableViewer 
 * } from '@/components/vinyl'
 * 
 * // Basic card with 3D tilt and flip
 * <VinylArtworkCard
 *   title="Mountain Sunset"
 *   image="/artwork.jpg"
 *   artistName="Jane Doe"
 *   href="/shop/mountain-sunset"
 * />
 * 
 * // Crate browser for collections
 * <VinylCrateBrowser
 *   items={artworks}
 *   renderItem={(item) => <VinylArtworkCard {...item} />}
 * />
 * ```
 */

// Main card components
export { VinylArtworkCard } from './VinylArtworkCard'
export type { VinylArtworkCardProps } from './VinylArtworkCard'

export { VinylCardFront } from './VinylCardFront'
export type { VinylCardFrontProps } from './VinylCardFront'

export { VinylCardBack } from './VinylCardBack'
export type { VinylCardBackProps } from './VinylCardBack'

export { VinylTiltEffect } from './VinylTiltEffect'
export type { VinylTiltEffectProps } from './VinylTiltEffect'

// Crate browsing components
export { VinylCrateBrowser } from './VinylCrateBrowser'
export type { VinylCrateBrowserProps } from './VinylCrateBrowser'

export { VinylCrateStack } from './VinylCrateStack'
export type { VinylCrateStackProps } from './VinylCrateStack'

// Turntable viewer
export { VinylTurntableViewer } from './VinylTurntableViewer'
export type { VinylTurntableViewerProps } from './VinylTurntableViewer'

export { VinylDropZone } from './VinylDropZone'
export type { VinylDropZoneProps } from './VinylDropZone'

// Detail panel for turntable viewer
export { VinylDetailPanel } from './VinylDetailPanel'
export type { VinylDetailPanelProps } from './VinylDetailPanel'

// Crate dividers for organization
export { VinylCrateDividers, presetDividers } from './VinylCrateDividers'
export type { VinylCrateDividersProps, CrateDivider } from './VinylCrateDividers'

// Hooks
export { useVinylCard } from './useVinylCard'
export type { UseVinylCardOptions, UseVinylCardReturn } from './useVinylCard'

export { useVinylCrate } from './useVinylCrate'
export type { UseVinylCrateOptions, UseVinylCrateReturn } from './useVinylCrate'

export { useVinylTurntable } from './useVinylTurntable'
export type { 
  UseVinylTurntableOptions, 
  UseVinylTurntableReturn,
  TurntableArtwork 
} from './useVinylTurntable'
