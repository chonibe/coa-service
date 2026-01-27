# Fix: Google OAuth 401 invalid_client / "OAuth client was not found"

**Error:** `Access blocked: Authorization Error` → `The OAuth client was not found` / `Error 401: invalid_client`

This means **Google** does not recognize the OAuth Client ID (or redirect URI) that Supabase is using.

---

## What likely broke it

**`supabase config push`** overwrote the hosted project’s Google provider config. The remote had a real Client ID; our `config.toml` uses `env(SUPABASE_GOOGLE_CLIENT_ID)`. Pushing replaced the working value with the env placeholder, which the hosted project doesn’t resolve → 401.

**Restore:** Set Google Client ID and Secret again in **Supabase Dashboard** (see below).  
**Avoid:** Do not run `supabase config push` if you rely on Dashboard-configured Google OAuth; it will overwrite it.

---

## 1. Get your Supabase callback URL (redirect URI)

Google must redirect to **Supabase’s** callback, not your app:

```
https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback
```

Or run:

```bash
npm run supabase:google-redirect-uri
```

---

## 2. Fix the OAuth client in Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com) and select the project that owns your OAuth client.

2. Go to **APIs & Services** → **Credentials**.

3. Under **OAuth 2.0 Client IDs**:
   - If you see **"The OAuth client was not found"** or **invalid_client**, the Client ID in Supabase may be wrong, or the client was deleted.
   - **Create** a new **Web application** client (or use an existing one):
     - **Application type:** Web application  
     - **Name:** e.g. `Street Collector (Supabase)`

4. **Authorized redirect URIs** — add **exactly**:
   ```
   https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback
   ```
   Also add for local dev if you use it:
   ```
   http://localhost:54321/auth/v1/callback
   ```
   (Use your actual Supabase project URL; replace `ldmppmnpgdxueebkkpid` if different.)

5. **Authorized JavaScript origins** (optional but recommended):
   - `https://app.thestreetcollector.com`
   - `https://ldmppmnpgdxueebkkpid.supabase.co`  
   - `http://localhost:3000` (for local dev)

6. **Save**. Copy the **Client ID** and **Client secret**.

---

## 3. Configure Supabase with the same credentials

### Option A: Supabase Dashboard (recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ldmppmnpgdxueebkkpid) → **Authentication** → **Providers**.
2. Open **Google**.
3. Set **Client ID** and **Client secret** to the values from Google Cloud Console.
   - If you previously had it working, the Client ID was  
     `410611814888-jf4hig26kj6j018qe70tudgpv5f694co.apps.googleusercontent.com`.  
     Use that same OAuth client in Google Cloud and paste its Client ID + Secret here.
4. Enable the provider and **Save**.

### Option B: Script (requires Auth API to accept PUT)

Ensure `.env.local` has:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_GOOGLE_CLIENT_ID` = Google Client ID  
- `SUPABASE_GOOGLE_CLIENT_SECRET` = Google Client secret  

Then:

```bash
DOTENV_CONFIG_PATH=.env.local npm run supabase:enable-google
```

---

## 4. Ensure your app env has the same Client ID / secret

If your app reads Google OAuth from env vars (e.g. for Gmail sync):

- **Vercel:** Project → Settings → Environment Variables.  
  Add `SUPABASE_GOOGLE_CLIENT_ID` and `SUPABASE_GOOGLE_CLIENT_SECRET` (same as Supabase).
- **Local:** `.env.local` — same vars.

Redeploy after changing Vercel env.

---

## 5. Stuck at `accounts.google.co.il/accounts/SetSID` (or similar)

**Symptom:** The browser hangs on a Google URL like `https://accounts.google.co.il/accounts/SetSID` after signing in.

**Causes:**
- **Redirect URI mismatch** — The Supabase callback URL must match **exactly** in Google Cloud Console (see §1–2). Any typo or wrong domain can prevent Google from redirecting back.
- **Third‑party cookies blocked** — SetSID is Google setting session cookies. Safari, Brave, or strict tracking protection can block this and break the redirect. Try Chrome with default settings or a private window with third‑party cookies allowed.
- **PKCE verifier not stored** — The app must use a cookie-based Supabase client for the OAuth **start** route so the PKCE `code_verifier` is stored. The **callback** then exchanges the code using that verifier. If the start route used a standalone client, exchange fails and the flow can appear stuck.

**What we fixed:**
- `/api/auth/google/start` now uses the route handler Supabase client (cookies) so the PKCE verifier is persisted and the callback can complete.

**What to try:**
1. Confirm §1–2: redirect URI exact match, correct OAuth client.
2. Use Chrome (or allow third‑party cookies) and retry in an incognito window.
3. Clear cookies for your app and `*.google.com`, then sign in again.

---

## 6. Checklist

- [ ] Google Cloud: OAuth **Web application** client exists.
- [ ] Google Cloud: **Authorized redirect URIs** includes  
      `https://ldmppmnpgdxueebkkpid.supabase.co/auth/v1/callback`
- [ ] Supabase Dashboard → **Providers** → **Google**: **Client ID** and **Client secret** match Google.
- [ ] App env (Vercel + local): `SUPABASE_GOOGLE_CLIENT_ID` and `SUPABASE_GOOGLE_CLIENT_SECRET` set and match.
- [ ] Retry sign-in; clear cookies/cache or use an incognito window if needed.

---

## 7. Optional: run redirect-URI helper

```bash
npm run supabase:google-redirect-uri
```

This prints the exact Supabase callback URL to add in Google Cloud Console.

---

## 8. ⚠️ Avoid `supabase config push` overwriting Google

`npm run supabase:config-push` pushes `supabase/config.toml` to the linked project. Our config uses `env(SUPABASE_GOOGLE_CLIENT_ID)` for Google; the **hosted** project does not use your local env. Pushing overwrites the Dashboard-configured Google Client ID/Secret and can cause 401. Either:

- **Don’t run config push** if you manage Google OAuth in the Dashboard, or  
- Keep Google provider config only in the Dashboard and avoid pushing auth.external.google from config.
