# Storage Buckets Setup

This document explains how to set up the required Supabase Storage buckets for the COA Service application.

## Required Buckets

### 1. `product-images` (Public)
- **Name**: `product-images`
- **Public**: Yes
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `image/webp`
- **Used for**: Product images, artwork images, vendor images

**Storage Policies:**
- **INSERT**: Allow authenticated users to upload images
- **SELECT**: Allow anonymous users to read images (public access)

### 2. `print-files` (Private)
- **Name**: `print-files`
- **Public**: No
- **File size limit**: 50 MB
- **Allowed MIME types**: `application/pdf`
- **Used for**: Print-ready files for production

**Storage Policies:**
- **INSERT**: Allow authenticated users to upload PDFs
- **SELECT**: Allow authenticated users to read PDFs only

### 3. `vendor-signatures` (Public) ⚠️ **NEW - REQUIRED**
- **Name**: `vendor-signatures`
- **Public**: Yes
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `image/webp`
- **Used for**: Artist signature images displayed on artwork pages

**Storage Policies:**
- **INSERT**: Allow authenticated vendors to upload signature images
- **SELECT**: Allow anonymous users to read signature images (public access)
- **UPDATE**: Allow authenticated vendors to update their own signatures
- **DELETE**: Allow authenticated vendors to delete their own signatures

## Setup Instructions

### Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Create each bucket with the settings above:
   - **Name**: Enter the bucket name (e.g., `vendor-signatures`)
   - **Public**: Toggle based on bucket type (public for `product-images` and `vendor-signatures`, private for `print-files`)
   - **File size limit**: Set appropriate limit
   - **Allowed MIME types**: Add the allowed types (optional but recommended)
5. After creating each bucket, set up the RLS policies:
   - Click on the bucket name
   - Go to **Policies** tab
   - Click **New policy**
   - Create policies for INSERT, SELECT, UPDATE, DELETE as described above

### Via Supabase CLI

```bash
# Create product-images bucket (public)
supabase storage create product-images --public

# Create print-files bucket (private)
supabase storage create print-files --private

# Create vendor-signatures bucket (public) ⚠️ REQUIRED
supabase storage create vendor-signatures --public
```

### Policy Examples for vendor-signatures Bucket

**INSERT Policy** (Allow vendors to upload):
```sql
CREATE POLICY "Vendors can upload signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-signatures' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'vendor_name'
);
```

**SELECT Policy** (Public read access):
```sql
CREATE POLICY "Public can read signatures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-signatures');
```

**UPDATE Policy** (Vendors can update their own):
```sql
CREATE POLICY "Vendors can update own signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-signatures' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'vendor_name'
);
```

**DELETE Policy** (Vendors can delete their own):
```sql
CREATE POLICY "Vendors can delete own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-signatures' AND
  (storage.foldername(name))[1] = auth.jwt() ->> 'vendor_name'
);
```

## Troubleshooting

### Error: "Bucket not found" (404)
**Solution**: The storage bucket hasn't been created yet. Follow the setup instructions above to create the `vendor-signatures` bucket.

### Error: "Access denied" or 403 errors
**Solution**: 
1. Verify the bucket exists
2. Check that RLS policies are configured correctly
3. Ensure the user is authenticated (for authenticated policies)
4. Verify the bucket is set to public if public access is required

### Error: "File size exceeds limit"
**Solution**: Check that the file size is within the bucket's limits:
- Images: 10 MB max (product-images)
- PDFs: 50 MB max (print-files)
- Signatures: 5 MB max (vendor-signatures)

### Error: "Column product_benefits.display_order does not exist"
**Solution**: Run the database migration `20260125000001_ensure_content_block_fields.sql` to add the required columns.

## Verification

After setting up the buckets, verify they work by:

1. **vendor-signatures bucket**:
   - Go to vendor profile page
   - Upload a signature image
   - Verify it appears on artwork pages

2. **product-images bucket**:
   - Test an image upload in the vendor product creation wizard
   - Check that uploaded images are accessible via public URLs

3. **print-files bucket**:
   - Test PDF upload functionality
   - Verify only authenticated users can access PDFs

## Related Files

- `app/api/vendor/profile/upload-signature/route.ts` - Signature upload handler
- `app/api/vendor/products/upload/route.ts` - Product file upload handler
- `app/api/vendor/products/upload-url/route.ts` - Generates upload paths
- `supabase/migrations/20260125000001_ensure_content_block_fields.sql` - Database migration for content blocks
