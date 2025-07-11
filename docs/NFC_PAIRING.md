# NFC Pairing Documentation

## Overview

The NFC (Near Field Communication) pairing system allows users to authenticate and claim digital artworks using NFC tags. This document provides a comprehensive guide to the NFC pairing process, implementation details, and technical considerations.

## System Architecture

### Components
- NFC Tag Scanner: Web-based interface for scanning NFC tags
- NFC Claim API: Backend endpoint for processing NFC tag claims
- Database Tables: 
  - `nfc_tags`: Tracks NFC tag metadata
  - `order_line_items_v2`: Stores artwork and order information

### Tag Lifecycle
1. **Unassigned**: Initial state of an NFC tag
2. **Claimed**: Tag assoc ated with a specific artwork and order
3. **Programmed**: Optional state indicating physical tag programming

## User Journey Flow

### 1. Initial NFC Tag Interaction
- User scans NFC tag embedded in artwork
- Tag redirects to a generic manufacturer's landing page
- Page contains embedded information about the artwork and authentication process

### 2. Authentication Process
- User prompted to log in to store account
- Successful login retrieves customer ID
- Redirected to customer dashboard with authenticated session

### 3. Customer Dashboard Experience
#### Artwork Display
- All purchased artworks listed
- Artwork status categorized:
  - **Paired**: NFC tag already associated
  - **Unpaired**: NFC tag not yet linked

#### Pairing Workflow
- Unpaired items can be selected for NFC tag pairing
- Each artwork has a unique Certificate of Authenticity
- Certificate includes:
  - Provenance ID
  - Artist information
  - Process images
  - Artwork content

### 4. NFC Tag Pairing
- Select unpaired artwork
- Initiate NFC tag pairing process
- Scan NFC tag to associate with artwork

### 5. Post-Pairing Benefits
- Unlocked content becomes available
- Future artwork drop notifications
- Exclusive artist information

## Technical Implementation

### Database Schema

#### `nfc_tags` Table
```sql
CREATE TABLE nfc_tags (
  id SERIAL PRIMARY KEY,
  tag_id VARCHAR(255) NOT NULL UNIQUE,
  line_item_id VARCHAR(255),
  order_id VARCHAR(255),
  certificate_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'unassigned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  programmed_at TIMESTAMP WITH TIME ZONE
);
```

### Claim Process Workflow

1. **Initiate Claim**
   - User scans NFC tag using Web NFC API
   - Client captures tag ID
   - Send claim request to `/api/nfc-tags/claim`

2. **Backend Validation**
   - Verify tag ID
   - Check if tag is already claimed
   - Validate associated line item and order
   - Update `nfc_tags` and `order_line_items_v2` tables

### Web NFC Compatibility

#### Supported Browsers
- Chrome (Desktop & Android)
- Edge
- Opera

#### Unsupported Platforms
- Safari
- iOS
- Some older browsers

## Integration Points

### Frontend
- `NfcTagScanner` component
- Handles NFC scanning
- Provides user feedback
- Triggers claim process

### Backend
- `/api/nfc-tags/claim` endpoint
- Processes NFC tag claims
- Manages tag and order metadata

## Security Considerations

- Prevent duplicate tag claims
- Validate user ownership
- Secure API endpoints
- Handle potential scanning errors

## Troubleshooting

### Common Issues
1. **Browser Not Supported**
   - Provide fallback UI
   - Suggest alternative browsers

2. **Scanning Failures**
   - Retry mechanisms
   - Detailed error messages

## Best Practices

- Always provide clear user instructions
- Handle edge cases gracefully
- Implement comprehensive error logging
- Offer manual tag entry as backup

## Future Improvements

- Enhanced cross-browser support
- Offline tag claim capabilities
- Advanced tag management features

## Example Usage

```typescript
// Typical NFC tag claim flow
const handleNfcClaim = async (tagId: string, lineItemId: string) => {
  try {
    const response = await fetch('/api/nfc-tags/claim', {
      method: 'POST',
      body: JSON.stringify({ 
        tagId, 
        lineItemId, 
        orderId, 
        customerId 
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // Handle successful claim
    }
  } catch (error) {
    // Handle claim errors
  }
};
```

## Contact and Support

For technical support or implementation details, contact the development team. 