# Auth Slide-up Menu

## Overview

The Auth Slide-up Menu provides in-context login/signup for shop users via a bottom slide-up sheet. It supports three authentication methods: **Email** (2-step OTP), **Google**, and **Facebook**.

**Implementation**: [`components/shop/auth/AuthSlideupMenu.tsx`](../../../components/shop/auth/AuthSlideupMenu.tsx)

## Features

- **Email OTP flow**: User enters email → receives 6-digit code → enters code to sign in
- **Google OAuth**: Redirects to Supabase Google provider
- **Facebook OAuth**: Redirects to Supabase Facebook provider (when enabled in Supabase)
- **Resend Code**: 60-second cooldown on email OTP resend
- **Collector profile creation**: After email OTP verification, ensures collector profile and role exist via `/api/auth/collector/ensure-profile`

## Usage

```tsx
import { AuthSlideupMenu } from '@/components/shop/auth/AuthSlideupMenu'

function MyComponent() {
  const [authOpen, setAuthOpen] = useState(false)
  return (
    <>
      <button onClick={() => setAuthOpen(true)}>Login or Sign Up</button>
      <AuthSlideupMenu
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo="/shop/experience"  // optional, default: /shop/experience
      />
    </>
  )
}
```

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/collector/ensure-profile` | Ensures collector profile and role exist; sets `collector_session` cookie. Called after email OTP verification. |
| `GET /api/auth/collector/google/start` | Initiates Google OAuth for collector flow |
| `GET /api/auth/collector/facebook/start` | Initiates Facebook OAuth for collector flow |

## Supabase Configuration

### 1. Email OTP (6-digit code)

By default, Supabase sends a **magic link** when using `signInWithOtp`. To send a **6-digit OTP code** instead:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Edit the **Magic Link** template (or the template used for `signInWithOtp`)
3. Replace the link content with the token variable:

```html
<h2>One time login code</h2>
<p>Please enter this code to sign in: <strong>{{ .Token }}</strong></p>
```

- Use `{{ .Token }}` for the 6-digit code
- Do **not** include `{{ .ConfirmationURL }}` if you want OTP-only (no magic link)
- OTP expires in 1 hour by default; configurable in **Auth → Providers → Email → Email OTP Expiration**

### 2. Facebook OAuth

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable **Facebook**
3. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com/) and add Facebook Login product
4. Set the OAuth redirect URI in Facebook app settings to your Supabase callback URL (e.g. `https://<project>.supabase.co/auth/v1/callback`)
5. Copy App ID and App Secret into Supabase Facebook provider settings

## Responsive Behavior

- **Mobile (&lt; 768px)**: Bottom slide-up sheet (full-width, rounded top corners)
- **Desktop (≥ 768px)**: Centered modal dialog (max-w-md, centered on screen)

## UI Flow

### Step 1: Login or Sign Up
- Email input
- Continue button (sends OTP)
- "or" separator
- Continue with Google
- Continue with Facebook
- Terms/Privacy footer link

### Step 2: Code Sent to Email
- Back arrow
- "Code Sent to Email" title
- Confirmation text with email
- Code input (6 digits)
- Continue button
- Resend Code link (with 60s cooldown)

## Dependencies

- `@supabase/auth-helpers-nextjs` – client-side Supabase auth
- `components/ui` – Sheet, Button, Input
- `lib/collector-session` – signed collector session cookie
- `lib/supabase-server` – server-side Supabase client

## Version

- Last updated: 2026-03-02
- Version: 1.0.0
