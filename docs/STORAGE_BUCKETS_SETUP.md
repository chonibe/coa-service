# Storage Buckets Setup

This document explains how to set up the required Supabase Storage buckets for the vendor product submission feature.

## Required Buckets

Two storage buckets must be created in your Supabase project:

### 1. `product-images` (Public)

- **Name**: `product-images`
- **Public**: Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: 
  - `image/png`
  - `image/jpeg`
  - `image/jpg`
  - `image/gif`
  - `image/webp`

**Storage Policies:**
- **INSERT**: Allow authenticated users to upload images
- **SELECT**: Allow anonymous users to read images (public access)

### 2. `print-files` (Private)

- **Name**: `print-files`
- **Public**: No
- **File size limit**: 50 MB
- **Allowed MIME types**:
  - `application/pdf`

**Storage Policies:**
- **INSERT**: Allow authenticated users to upload PDFs
- **SELECT**: Allow authenticated users to read PDFs only

## Setup Instructions

### Option 1: Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create each bucket with the settings above
5. After creating each bucket, set up the RLS policies:
   - Click on the bucket name
   - Go to **Policies** tab
   - Click **New policy**
   - Create the INSERT and SELECT policies as described above

### Option 2: Via Supabase CLI

You can create buckets using the Supabase Management API or CLI:

```bash
# Create product-images bucket (public)
supabase storage create product-images --public

# Create print-files bucket (private)
supabase storage create print-files --private

# Set policies (example - adjust as needed)
# Note: Policies need to be set via the dashboard or Management API
```

### Option 3: Via API Route (Automated Setup)

You can create an API route that automatically sets up the buckets if they don't exist. However, this requires the Supabase service role key.

**Warning**: This approach uses the service role key and should only be run in a secure environment or during initial setup.

## Troubleshooting

### Error: "Bucket not found"

If you see this error, it means the storage bucket hasn't been created yet. Follow the setup instructions above.

### Error: "Access denied" or 403 errors

This usually means the RLS policies aren't configured correctly. Ensure:
1. The bucket exists
2. The correct policies are in place (INSERT for uploads, SELECT for reads)
3. The user is authenticated (for authenticated policies)

### Error: "File size exceeds limit"

Check that the file size is within the bucket's limits:
- Images: 10 MB max
- PDFs: 50 MB max

## Verification

After setting up the buckets, verify they work by:

1. Testing an image upload in the vendor product creation wizard
2. Checking that uploaded images are accessible via public URLs
3. Testing PDF upload functionality

## Related Files

- `app/api/vendor/products/upload-url/route.ts` - Generates upload paths
- `app/api/vendor/products/upload/route.ts` - Server-side upload handler
- `app/api/vendor/products/images/route.ts` - Lists vendor images
- `app/vendor/dashboard/products/create/components/images-step.tsx` - Client-side upload UI

