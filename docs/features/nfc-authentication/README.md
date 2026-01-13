# NFC Authentication (Mobile-First)

## Overview
The NFC Authentication system allows collectors to physically verify ownership of their artworks using NFC tags. This implementation is mobile-first, utilizing bottom sheets and Web NFC for a native-like experience on supported devices.

## Features
- **Mobile-Native UI**: Uses `vaul` bottom sheets for ergonomic one-handed use.
- **Web NFC Integration**: Direct scanning on Chrome for Android.
- **iOS Support**: Instructional fallback for Safari/iOS users to use native system scanning.
- **Haptic Feedback**: Tactile vibration alerts on scan success.
- **Gamification**: Instant reward of Ink-O-Gatchi credits upon successful authentication.
- **Centralized Component**: The `NFCAuthSheet` is shared across the dashboard and profile.

## Technical Implementation

### Components
- `components/nfc/nfc-auth-sheet.tsx`: The main multi-step wizard.
- `hooks/use-nfc-scan.ts`: React hook wrapping the Web NFC API.

### API Endpoints
- `POST /api/nfc-tags/claim`: Links a physical tag ID to a digital line item.
  - **Payload**: `{ tagId: string, lineItemId: string, orderId: string }`
  - **Response**: `{ success: true, reward: { amount: number } }`

### Data Flow
1. User selects "Authenticate" from their collection.
2. `NFCAuthSheet` detects device support.
3. If supported, user is guided through positioning and scanning.
4. On scan, the tag's serial number is sent to `/api/nfc-tags/claim`.
5. The backend validates the tag, marks the edition as authenticated, and returns a reward.
6. The UI displays a celebratory success state.

## Testing Steps
1. **Android (Chrome)**: 
   - Open the dashboard.
   - Click "Authenticate" on a pending artwork.
   - Follow the wizard and scan a physical NTAG213/215 tag.
2. **iOS (Safari)**:
   - Observe the instructional fallback.
   - Close the browser and scan the tag natively to verify redirection logic.

## Deployment Considerations
- Requires HTTPS for Web NFC API to function.
- `NEXTAUTH_SECRET` or `JWT_SECRET` must be configured for signed token verification in redirect flows.

## Versioning
- **Current Version**: 2.0.0 (Integrated Mobile-First)
- **Last Updated**: 2026-01-13
