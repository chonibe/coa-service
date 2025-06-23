# NFC Pairing Wizard

## Overview
The NFC Pairing Wizard provides a comprehensive, step-by-step process for pairing NFC tags with individual line items in an order.

## Features

### Multi-Step Pairing Process
- Guided NFC tag pairing workflow
- Support for multiple line items
- Detailed progress tracking

### Pairing Stages
1. **Introduction**: Prepare for NFC tag pairing
2. **Scanning**: Detect NFC tag
3. **Verification**: Authenticate NFC tag
4. **Success**: Confirm pairing
5. **Error Handling**: Provide retry or cancel options

## Technical Implementation

### Web NFC API
- Uses modern Web NFC API for tag detection
- Fallback for unsupported browsers
- Secure tag verification process

### Error Handling
- Comprehensive error states
- User-friendly error messages
- Retry and cancel options

## Props

```typescript
interface NFCPairingWizardProps {
  lineItems: {
    id: string
    name: string
    nfcTagId?: string
  }[]
  onPairingComplete: (pairingResults: Record<string, string>) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

## Usage Example

```tsx
<NFCPairingWizard 
  lineItems={orderLineItems}
  onPairingComplete={async (results) => {
    // Save pairing results to database
    await savePairingResults(results)
  }}
  open={isPairingModalOpen}
  onOpenChange={setIsPairingModalOpen}
/>
```

## Accessibility
- Keyboard navigable
- Screen reader friendly
- High contrast modes supported

## Performance Considerations
- Minimal re-renders
- Efficient state management
- Lightweight implementation

## Browser Compatibility
- Requires Web NFC API support
- Graceful degradation for unsupported browsers

## Future Improvements
- Enhanced error logging
- More detailed tag verification
- Support for multiple NFC tag formats 