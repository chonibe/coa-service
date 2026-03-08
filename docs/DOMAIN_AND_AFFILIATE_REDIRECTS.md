# Domain and affiliate redirects

## How redirects work

When a request **reaches this app** (on Vercel), the following happen:

1. **Bare domain → www**  
   `thestreetcollector.com` → `https://www.thestreetcollector.com` (same path and query).  
   So `thestreetcollector.com/collections/kymo-one` becomes `www.thestreetcollector.com/collections/kymo-one`.

2. **Main page**  
   The root **/** is the main landing page (same content as the street-collector experience). When you land on **thestreetcollector.com** or **www.thestreetcollector.com**, you see this at `/` with no redirect to `/shop/street-collector`.

3. **Shopify-style URLs → app routes** (middleware; keep /collections out of Vercel edge redirects so middleware can set the cookie):
   - **Product links** `/products/:handle` → **main landing** (`/`). Affiliate cookie is set so the Experience gets the vendor filter.
   - **Collection links** `/collections/:handle` (e.g. `/collections/tiago-hesp`) → **main landing** (`/`). The collection handle is used as the artist slug for the cookie so when the user opens the Experience, the vendor filter and spotlight are applied. Query params preserved.

4. **Favicon**  
   `/favicon.ico` redirects to the CDN logo.

5. **thestreetlamp.com → thestreetcollector.com**  
   If the request host is `thestreetlamp.com` or `www.thestreetlamp.com`, middleware redirects (308) to `https://www.thestreetcollector.com` with the same path and query. So links like `https://www.thestreetlamp.com/products/year-of-the-snake?fbclid=...` end up on the canonical site and get the product/artist cookie and landing behaviour.

## Redirecting thestreetlamp.com (Shopify) to thestreetcollector.com

**thestreetlamp.com is on Shopify**, so you cannot point that domain to Vercel. Use one of these approaches instead.

### Option A: Domain forwarding at the registrar (whole domain)

If you want **all** traffic from thestreetlamp.com to go to thestreetcollector.com (and are okay with thestreetlamp.com no longer serving the Shopify store):

1. **Where the domain is registered** (GoDaddy, Namecheap, Cloudflare, etc.), open the DNS or domain settings for **thestreetlamp.com**.
2. **Enable domain forwarding / URL redirect** (name varies by provider):
   - **Forward to:** `https://www.thestreetcollector.com`
   - **Redirect type:** 301 (permanent).
   - If the option exists, choose **“Forward with path”** or **“Redirect with path and query”** so that  
     `thestreetlamp.com/products/year-of-the-snake?fbclid=...`  
     becomes  
     `https://www.thestreetcollector.com/products/year-of-the-snake?fbclid=...`
3. Do the same for **www.thestreetlamp.com** if your registrar treats it separately.
4. After propagation, opening any thestreetlamp.com link will land on thestreetcollector.com with the same path and query; the app will then redirect to `/` and set the product/artist cookie so the Experience shows the right spotlight.

**Note:** After this, thestreetlamp.com will no longer load the Shopify store. Use this only if you are retiring that store or moving everything to thestreetcollector.com.

### Option B: Redirects inside Shopify (per product/collection)

To send only **specific** product or collection URLs from Shopify to thestreetcollector.com:

1. In **Shopify Admin**: **Online Store** → **Navigation** → **URL Redirects** (or **Settings** → **Online Store** → **Redirects**, depending on your theme/version).
2. **Create a redirect** (or import via CSV):
   - **Redirect from:** `/products/year-of-the-snake` (path only, no domain).
   - **Redirect to:** `https://www.thestreetcollector.com/products/year-of-the-snake`
3. Repeat for each product/collection handle you want (e.g. `/products/...`, `/collections/...`). Use **Bulk import** (CSV with “Redirect from” and “Redirect to”) if you have many.
4. Query strings (e.g. `?fbclid=...`) are usually preserved by Shopify when redirecting; the app will then apply the product cookie and spotlight.

**Note:** Shopify’s redirect tool may in some cases only allow redirecting broken (404) URLs. If you cannot redirect a live product URL to an external site, use Option A (domain forwarding) for those links instead.

## If redirects don’t happen

Redirects only run when the request is handled by this Next.js app on Vercel.

- If you open **thestreetcollector.com** (no www) and get 422, a blank page, or no redirect, the **apex domain** is likely not pointing to Vercel (e.g. it’s still on GoDaddy or another host). That host is answering the request, so our middleware never runs.

**Fix:**

1. **Vercel**  
   Project → Settings → Domains → add **thestreetcollector.com** (no www).  
   Optionally set “Redirect to www.thestreetcollector.com”.

2. **DNS**  
   - **If using Vercel nameservers** (domain’s nameservers set to Vercel): DNS is managed in Vercel; you can’t add redirects or records in GoDaddy.  
   - **If using GoDaddy (or other) DNS**: Point the **apex** (thestreetcollector.com, “@”) to Vercel via the A or CNAME record Vercel shows.

3. **Test**  
   After DNS propagates, open:
   - `https://www.thestreetcollector.com/collections/kymo-one`
   - `https://www.thestreetcollector.com/products/dog-1?utm_campaign=artist_kymo`  
   You should be redirected to `/shop/artists/kymo-one` and `/` (main page); the affiliate cookie is set so the Experience vendor filter applies when they open it.  
   Then try the same URLs with `thestreetcollector.com` (no www); they should first redirect to www, then to the app routes.

## “Your connection is not private” / ERR_CERTIFICATE_TRANSPARENCY_REQUIRED

When you open **https://thestreetcollector.com** (no www) and Chrome shows “Your connection is not private” and `net::ERR_CERTIFICATE_TRANSPARENCY_REQUIRED`, the **apex domain’s SSL certificate** is not accepted by Chrome’s Certificate Transparency (CT) checks.

**What’s going on**

- Vercel issues a certificate for `thestreetcollector.com` (Let’s Encrypt R13). Chrome then checks the embedded SCTs (Signed Certificate Timestamps).
- If you see **“Invalid timestamp”** on the SCTs (e.g. Sectigo Tiger2026h1, Google Argon2026h1), the cert was logged but the timestamps are not accepted by Chrome yet. That can happen with new log operators or timing; the only fix is to get a **new certificate** with valid SCTs.
- If the cert was just issued, it can also take a few minutes to ~24 hours for CT to propagate; in that case waiting may resolve it.

**What to do**

1. **Use www for now**  
   Share and use **https://www.thestreetcollector.com/...** (e.g. `https://www.thestreetcollector.com/products/hands?utm_campaign=artist_kymo&...`). The www certificate is usually already valid and in CT logs.

2. **Check in Vercel**  
   Project → **Settings** → **Domains** → open **thestreetcollector.com**. Ensure it’s “Verified” and that there’s no certificate warning. If it says “Certificate pending” or similar, wait until it shows as valid.

3. **Wait for CT propagation**  
   Once Vercel shows a valid certificate for the apex, wait a bit for it to appear in CT logs. After that, Chrome will stop showing the error for `https://thestreetcollector.com`.

4. **Redirect apex to www (only if not using Vercel nameservers)**  
   If the domain still uses **GoDaddy (or other) DNS** (not Vercel nameservers), you can set a **domain redirect** there so `thestreetcollector.com` → `www.thestreetcollector.com`. Then users never hit the apex directly.  
   **If you use Vercel nameservers**, DNS and redirects are managed in Vercel only—you can’t add redirects or CDN settings in GoDaddy. The project has a **vercel.json** redirect so that when the host is `thestreetcollector.com`, all paths redirect to `https://www.thestreetcollector.com` (once the apex cert is valid, everyone lands on www).

5. **Force a new certificate (fix “Invalid timestamp” SCTs)**  
   If the cert shows **Invalid timestamp** on the CT SCTs, Chrome will keep rejecting it. Trigger a **new issuance** so Vercel/Let’s Encrypt issues a new cert (with fresh SCTs):

   - **Vercel Dashboard:** Project → **Settings** → **Domains** → find **thestreetcollector.com** → **Remove** (only the apex; keep www). Wait a minute, then **Add** **thestreetcollector.com** again and assign it to the project. Vercel will issue a new certificate; after it’s active, test in Chrome again.
   - **Vercel CLI** (from the scope that owns the domain):  
     `vercel certs issue thestreetcollector.com www.thestreetcollector.com`  
     If you see a permission error, use the dashboard method above.

   After a new cert is issued, wait a few minutes and retry https://thestreetcollector.com. If the new cert still has invalid SCTs, the issue may be on Let’s Encrypt / the log operators; use **https://www.thestreetcollector.com** in the meantime.

**Affiliate links**

- Safe to use: **https://www.thestreetcollector.com/products/hands?utm_source=affiliate&utm_medium=referral&utm_campaign=artist_kymo&utm_content=kymo_hands**
- These redirect to the main page (`/`) with the affiliate cookie set; when the user opens the Experience, the vendor filter is pre-applied.

## Affiliate tracking

When the URL has `artist=...` or `utm_campaign=artist_*`, the app sets a cookie so the Experience page can pre-select that artist in the vendor filter. The cookie is set on the redirect response and on normal page responses.

**Session storage for tracking**

- **Client (sessionStorage):** The full affiliate landing URL and UTM params (`landingUrl`, `artist`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) are saved under `sc_affiliate_session_url` via `setStoredAffiliateSession` / `getStoredAffiliateSession` in `lib/affiliate-tracking.ts`. Use this for client-side analytics or to send attribution with events.
- **Server (cookie):** The affiliate query string (artist + UTM params) is stored in the `sc_affiliate_session` cookie (7-day expiry) so server-side code (e.g. checkout, API) can read it from the request and attribute the session. Parse the cookie value as `URLSearchParams` or key=value pairs for tracking.
