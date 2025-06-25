# ArtworkCard Component

## Overview
The `ArtworkCard` is a versatile, reusable component for displaying digital artwork across different dashboards and views.

## Features
- Multiple display variants
- Responsive design
- Interactive elements
- Rarity and authentication status
- Flexible configuration

## Props

### ArtworkCardProps
```typescript
interface ArtworkCardProps {
  artwork: {
    id: string
    name: string
    imageUrl?: string
    vendorName?: string
    editionNumber?: number
    editionTotal?: number
    price?: number
    certificateUrl?: string
    nfcClaimedAt?: string
    nfcTagId?: string
  }
  variant?: 'default' | 'compact' | 'detailed'
  onCertificateView?: () => void
  onSelect?: () => void
  isSelected?: boolean
}
```

## Variants

### Default Variant
- Full artwork details
- Hover effects
- Rarity and authentication status
- Certificate and external link options

### Compact Variant
- Minimal artwork representation
- Quick overview
- Authentication status

### Detailed Variant
- Larger image
- Comprehensive artwork information
- Edition details

## Usage Examples

### Basic Usage
```tsx
<ArtworkCard
  artwork={{
    id: "artwork-1",
    name: "Sunset Horizon",
    imageUrl: "/path/to/image.jpg",
    vendorName: "Jane Doe",
    editionNumber: 5,
    editionTotal: 100,
    price: 299.99,
    certificateUrl: "/certificate/artwork-1"
  }}
/>
```

### With Interactions
```tsx
<ArtworkCard
  artwork={artwork}
  variant="detailed"
  isSelected={selectedArtworkId === artwork.id}
  onSelect={() => handleArtworkSelection(artwork)}
  onCertificateView={() => openCertificateModal(artwork)}
/>
```

## Rarity Calculation
The component automatically calculates artwork rarity based on edition number:
- Ultra Rare: > 90% limited
- Rare: > 70% limited
- Limited: > 50% limited
- Common: Standard edition

## Authentication Status
Displays authentication status via badge:
- Green: Authenticated (NFC claimed)
- Amber: Pending authentication

## Accessibility
- Keyboard navigable
- Screen reader friendly
- High contrast modes supported

## Performance Considerations
- Lazy loading for images
- Minimal re-renders
- Optimized for large collections

## Version
- Component Version: 1.0.0
- Last Updated: ${new Date().toISOString()}

## Future Improvements
- Custom rarity calculation hook
- More interaction options
- Enhanced accessibility features 