# Commit log: Shop SEO + GEO + structured data (2026-04-04)

## Checklist (what shipped)

- [x] [`app/robots.ts`](../../app/robots.ts) — crawl rules, AI user-agents allowed, `/api/` disallowed, sitemap URL
- [x] [`app/sitemap.ts`](../../app/sitemap.ts) — static hubs + dynamic artist + product URLs
- [x] [`public/llms.txt`](../../public/llms.txt) — LLM discovery index
- [x] [`lib/seo/site-url.ts`](../../lib/seo/site-url.ts) — canonical origin helper
- [x] [`lib/shop/fetch-artist-profile.ts`](../../lib/shop/fetch-artist-profile.ts) — shared artist resolver for API + RSC
- [x] Artist route — server `generateMetadata`, JSON-LD, [`ArtistPageClient.tsx`](../../app/(store)/shop/artists/[slug]/ArtistPageClient.tsx)
- [x] Product route — [`[handle]/layout.tsx`](../../app/(store)/shop/[handle]/layout.tsx) metadata + JSON-LD
- [x] On-page GEO — answer-first copy, FAQs aligned with schema, PDP alt fallback
- [x] [`docs/features/street-collector/SEO-shop.md`](../../docs/features/street-collector/SEO-shop.md) — implementation map

## Post-deploy verification

- [ ] Rich Results Test on live artist + PDP URLs
- [ ] GSC URL inspection
