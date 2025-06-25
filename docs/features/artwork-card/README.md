# Artwork Card Component

## Overview
The Artwork Card is a versatile UI component for displaying artwork details with multiple interaction modes.

## Features

### Variants
- `default`: Full artwork card with hover effects
- `compact`: Condensed view for lists
- `detailed`: Expanded view with more information

### NFC Pairing
- New NFC pairing icon for unpaired artworks
- Modal-based pairing interface
- Supports async pairing process

### Certificate Viewing
- Enhanced certificate modal with advanced features
- Fullscreen toggle
- Download and share options

## Props

### ArtworkCard Props
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
  onNfcPair?: () => Promise<void>
  isSelected?: boolean
}
```

### CertificateModal Props
```typescript
interface CertificateModalProps {
  certificateUrl: string
  artworkName: string
  editionNumber?: number
  editionTotal?: number
  vendorName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

## Usage Example

```tsx
<ArtworkCard 
  artwork={artwork} 
  variant="default"
  onCertificateView={() => setCertificateOpen(true)}
  onNfcPair={async () => {
    // Implement NFC pairing logic
    await pairNfcTag(artwork.id)
  }}
/>

<CertificateModal 
  certificateUrl={artwork.certificateUrl}
  artworkName={artwork.name}
  open={certificateOpen}
  onOpenChange={setCertificateOpen}
/>
```

## Accessibility
- Keyboard navigable
- Screen reader friendly
- High contrast modes supported

## Performance Considerations
- Lazy loading of images
- Minimal re-renders with React hooks
- Optimized for mobile and desktop

## Future Improvements
- Add more certificate interaction options
- Enhance NFC pairing UX
- Support more artwork metadata 