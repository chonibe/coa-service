# Tagging Shopify Checkout Thank-You Pages (GA4)

## Why those URLs show "Not tagged"

URLs like:

- `thestreetcollector.com/checkouts/cn/.../en/thank-you`
- `thestreetcollector.com/checkouts/cn/.../en-be/thank-you`

are **Shopify Checkout** thank-you (order status) pages. They are **served by Shopify**, not by the Next.js app. The GA tag lives in the app’s root layout, so it never runs on these pages — that’s why Tag coverage reports them as **Not tagged**.

## How to get them tagged

Add the same GA4 measurement tag so it runs on Shopify’s order status page. Use the **same measurement ID** as the app (`G-V9LJ3T3LK8`) so all data goes to one property.

### Option A: Order status page script (current Shopify checkout)

1. In **Shopify Admin**: **Settings → Checkout**.
2. Scroll to **Order status page** (or **Additional scripts** / script section for the thank-you page).
3. In the script / custom code area, add:

```html
<!-- Google Analytics (same ID as app) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-V9LJ3T3LK8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-V9LJ3T3LK8');
</script>
```

4. Save. After that, thank-you page views will be sent to the same GA4 property and Tag coverage should show the page as tagged.

Optional: use Shopify’s Liquid so you only send a **purchase** event once (e.g. with `first_time_accessed` and `checkout.order_id`, `checkout.total_price`, etc.) — see Shopify’s docs for the exact variables and the note below about migration.

### Option B: Google & YouTube app (recommended longer term)

Shopify is moving away from custom scripts on checkout:

- **Shopify Admin → Apps → Google & YouTube** (or install it from the App Store).
- Connect your GA4 property and turn on **conversion tracking** so checkout/thank-you and purchase events are sent by the app.

That way thank-you pages stay tagged even after script sections are deprecated.

### Migration note

Shopify is deprecating the “additional scripts” / script section on the order status page (dates vary by plan). Prefer **Option B** for a lasting setup; use **Option A** for a quick fix with the same measurement ID until you migrate.

## Summary

| Page | Served by | How it gets tagged |
|------|-----------|--------------------|
| App pages (e.g. `/shop`, `/shop/experience`) | Next.js app | Root layout → `GoogleAnalytics` component (already tagged). |
| Shopify thank-you (`/checkouts/cn/.../thank-you`) | Shopify | Add gtag in **Settings → Checkout → Order status page** (or use Google & YouTube app). Use **G-V9LJ3T3LK8** so it’s the same property. |
