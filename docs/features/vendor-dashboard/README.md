# Vendor Dashboard

## Profile Management

### Profile Editing Feature

#### Overview
The profile editing feature allows vendors to:
- Update their profile picture
- Edit their artist bio
- Customize their dashboard representation

#### Key Features
- Instagram-like profile image upload
- Bio editing with character validation
- Real-time preview of changes
- Persistent storage in Supabase

#### Technical Implementation

##### Components
- `ProfileEdit.tsx`: Main profile editing component
  - Handles image upload
  - Manages bio editing state
  - Provides validation and error handling

##### Storage
- Profile images stored in Supabase Storage
  - Bucket: `vendor-profiles`
  - Filename format: `{vendor_id}/profile_{timestamp}.{ext}`

##### Validation
- Profile Image
  - Supports common image formats
  - Client-side preview
  - Server-side upload validation

- Bio
  - Minimum length: 10 characters
  - Trims whitespace
  - Prevents empty submissions

#### Database Schema
```typescript
type VendorProfile = {
  id: string;           // User ID
  name: string;         // Vendor name
  bio: string;          // Artist bio
  profile_image_url: string | null; // Profile image URL
}
```

#### User Experience
- Intuitive, mobile-friendly interface
- Immediate visual feedback
- Toast notifications for actions

#### Future Improvements
- Social media link integration
- Advanced image cropping
- More detailed profile customization

#### Known Limitations
- Single profile per vendor
- Image size restrictions apply
- Requires active internet connection for updates

## Changelog
- Added profile editing functionality
- Implemented bio and image upload
- Enhanced vendor dashboard settings 