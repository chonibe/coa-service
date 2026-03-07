# Domain and affiliate redirects

## How redirects work

When a request **reaches this app** (on Vercel), the following happen:

1. **Bare domain → www**  
   `thestreetcollector.com` → `https://www.thestreetcollector.com` (same path and query).  
   So `thestreetcollector.com/collections/kymo-one` becomes `www.thestreetcollector.com/collections/kymo-one`.

2. **Shopify-style URLs → app routes** (in middleware):
   - `/products/:handle` → `/shop/:handle` (e.g. `/products/dog-1` → `/shop/dog-1`)
   - `/collections/:handle` → `/shop/artists/:handle` (e.g. `/collections/kymo-one` → `/shop/artists/kymo-one`)  
   Query strings (e.g. `?utm_campaign=artist_kymo`) are preserved. Affiliate cookie is set when present.

3. **Favicon**  
   `/favicon.ico` redirects to the CDN logo.

## If redirects don’t happen

Redirects only run when the request is handled by this Next.js app on Vercel.

- If you open **thestreetcollector.com** (no www) and get 422, a blank page, or no redirect, the **apex domain** is likely not pointing to Vercel (e.g. it’s still on GoDaddy or another host). That host is answering the request, so our middleware never runs.

**Fix:**

1. **Vercel**  
   Project → Settings → Domains → add **thestreetcollector.com** (no www).  
   Optionally set “Redirect to www.thestreetcollector.com”.

2. **DNS (e.g. GoDaddy)**  
   Point the **apex** (thestreetcollector.com, sometimes “@”) to Vercel the same way you did for `www` (A record or CNAME as shown in Vercel for the apex).

3. **Test**  
   After DNS propagates, open:
   - `https://www.thestreetcollector.com/collections/kymo-one`
   - `https://www.thestreetcollector.com/products/dog-1?utm_campaign=artist_kymo`  
   You should be redirected to `/shop/artists/kymo-one` and `/shop/dog-1?...` and see the correct pages.  
   Then try the same URLs with `thestreetcollector.com` (no www); they should first redirect to www, then to the `/shop/...` URLs.

## Affiliate tracking

When the URL has `artist=...` or `utm_campaign=artist_*`, the app sets a cookie so the Experience page can pre-select that artist in the vendor filter. The cookie is set on the redirect response and on normal page responses.
