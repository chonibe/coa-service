# Commit log: Instagram images via Graph API Business Discovery (optional)

**Date:** 2026-04-03

## Checklist

- [x] [`lib/instagram/business-discovery.ts`](../../lib/instagram/business-discovery.ts) — `fetchInstagramBusinessDiscoveryMedia`, `mergeInstagramDiscoveryIfNeeded` (manual showcase still overrides).
- [x] [`app/api/shop/artists/[slug]/route.ts`](../../app/api/shop/artists/[slug]/route.ts) — Merges discovery into artist JSON before response.
- [x] [`app/api/proxy-image/route.ts`](../../app/api/proxy-image/route.ts) + [`lib/proxy-cdn-url.ts`](../../lib/proxy-cdn-url.ts) — Allow/proxy `*.cdninstagram.com`, `*.fbcdn.net`.
- [x] [`.env.example`](../../.env.example) — `INSTAGRAM_BUSINESS_DISCOVERY_IG_USER_ID`, `INSTAGRAM_ACCESS_TOKEN`.
- [x] [`artist-profile-content-spec.md`](../features/street-collector/artist-profile-content-spec.md) §7 — Limits (professional accounts only, Meta app).
- [x] [`explore-artists/README.md`](../features/street-collector/explore-artists/README.md) changelog 1.1.5.

## Limitations (Meta)

- Targets must be **Instagram Professional** (Business/Creator). Personal accounts return no media via this API.
- Requires correct **permissions** and a **long-lived token**; see [Business Discovery](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery).
