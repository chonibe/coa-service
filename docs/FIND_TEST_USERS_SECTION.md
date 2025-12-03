# Finding Test Users Section in Google Cloud Console

## If You Don't See "Test users" Section

### Step 1: Check App Publishing Status

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**

### Step 2: Check Publishing Status

Look at the top of the OAuth consent screen page. You'll see one of these:

**Option A: "Publishing status: Testing"**
- If you see this, scroll down to find the **"Test users"** section
- It should be below the "Scopes" section
- If you still don't see it, the app might need to be saved first

**Option B: "Publishing status: In production"**
- If your app is already published, you won't see test users
- You'll need to either:
  - **Option 1**: Unpublish the app (change back to Testing)
  - **Option 2**: Complete verification for production use

### Step 3: Change to Testing Mode (If Needed)

If your app is published:

1. On the OAuth consent screen page
2. Look for **"PUBLISH APP"** button or **"BACK TO TESTING"** link
3. Click to change status back to "Testing"
4. Save changes
5. The "Test users" section should now appear

### Step 4: Alternative - Check User Type Setting

1. On the OAuth consent screen
2. Look for **"User type"** section
3. Make sure it's set to **"External"** (not "Internal")
4. For External apps, you can add test users

### Step 5: Where to Find Test Users

The "Test users" section is typically located:
- Below the "Scopes" section
- Above the "Authorized domains" section
- It shows: "Test users" with a "+ ADD USERS" button

### If Still Not Visible

Try these steps:

1. **Save the OAuth consent screen** first (even if you haven't made changes)
2. **Refresh the page**
3. **Check if you have the right permissions** - you need to be an Owner or Editor of the project
4. **Try a different browser** or clear cache

### Quick Alternative: Add via API

If the UI doesn't show test users, you can also add them programmatically, but the UI method is usually easier.

## Visual Guide

The OAuth consent screen should show sections in this order:
1. App information (name, logo, etc.)
2. App domain
3. Authorized domains
4. **Scopes** ← Check here
5. **Test users** ← Should be here
6. Publishing status

If "Test users" is missing, the app is likely published. Change it back to Testing mode.

