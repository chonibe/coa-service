# Fix Google OAuth Verification for Gmail Scopes

## Problem
Error 403: `access_denied` - The app hasn't completed Google verification and is in testing mode. Gmail scopes require either:
1. Verified test users (for testing mode)
2. App verification (for production)

## Solution: Add Test Users (Quick Fix)

### Step 1: Go to OAuth Consent Screen

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**

### Step 2: Add Test Users

1. Scroll down to **"Test users"** section
2. Click **"+ ADD USERS"**
3. Add your email address: `choni@thestreetlamp.com`
4. Add any other email addresses that need access
5. Click **"ADD"**

### Step 3: Try Again

1. Log out and log back in with Google
2. Use the email address you added as a test user
3. The OAuth flow should now work

## Alternative: Publish App (For Production)

If you want anyone to use the app:

### Step 1: Prepare for Verification

1. Go to **OAuth consent screen**
2. Fill out all required fields:
   - App name
   - User support email
   - Developer contact information
   - App logo (optional but recommended)
   - App domain
   - Privacy policy URL
   - Terms of service URL

### Step 2: Request Verification

1. Click **"PUBLISH APP"**
2. For Gmail scopes, Google will require:
   - Privacy policy URL
   - Terms of service URL
   - Security assessment (for sensitive scopes)
   - Video demonstration of app usage

### Step 3: Verification Process

- Google reviews apps requesting sensitive scopes (like Gmail)
- This can take several days to weeks
- You'll need to provide justification for why you need Gmail access

## Recommended Approach

**For now (testing/development):**
- Add test users to the OAuth consent screen
- This allows immediate access without verification

**For production:**
- Complete app verification process
- This allows any user to authenticate

## Important Notes

- **Test users**: Only the email addresses you add can authenticate
- **Verification**: Required for production use with sensitive scopes
- **Gmail scopes**: Always require verification for production, or test users for testing mode

## Quick Fix Steps Summary

1. Google Cloud Console → APIs & Services → OAuth consent screen
2. Scroll to "Test users"
3. Click "+ ADD USERS"
4. Add `choni@thestreetlamp.com` (and any other emails)
5. Save
6. Try OAuth again with one of the test user emails

