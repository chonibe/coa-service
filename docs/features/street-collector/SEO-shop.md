# Street Collector — shop SEO, GEO, and structured data

## Overview

Technical and on-page SEO for storefront routes: server-rendered metadata for artist and product URLs, dynamic `robots.txt` / `sitemap.xml`, `llms.txt`, JSON-LD (Person, Product, FAQPage, BreadcrumbList), answer-first copy, and shared meta/alt helpers.

## Implementation (code)

| Area | Location |
|------|----------|
| Canonical site URL | [`lib/seo/site-url.ts`](../../../lib/seo/site-url.ts) |
| Artist meta templates | [`lib/seo/artist-meta.ts`](../../../lib/seo/artist-meta.ts) |
| Artist FAQs (UI + JSON-LD) | [`lib/seo/artist-faqs.ts`](../../../lib/seo/artist-faqs.ts) |
| Product meta + answer-first | [`lib/seo/product-meta.ts`](../../../lib/seo/product-meta.ts) |
| Product FAQs (UI + JSON-LD) | [`lib/seo/product-faqs.ts`](../../../lib/seo/product-faqs.ts) |
| PDP image alt fallback | [`lib/seo/product-image-alt.ts`](../../../lib/seo/product-image-alt.ts) |
| Shared artist fetch (API + RSC) | [`lib/shop/fetch-artist-profile.ts`](../../../lib/shop/fetch-artist-profile.ts) |
| Request cache for RSC | [`lib/shop/cached-shop-data.ts`](../../../lib/shop/cached-shop-data.ts) |
| `robots.txt` | [`app/robots.ts`](../../../app/robots.ts) |
| `sitemap.xml` | [`app/sitemap.ts`](../../../app/sitemap.ts) |
| `llms.txt` | [`public/llms.txt`](../../../public/llms.txt) |
| Artist page (server + metadata) | [`app/(store)/shop/artists/[slug]/page.tsx`](../../../app/(store)/shop/artists/[slug]/page.tsx) |
| Artist client shell | [`app/(store)/shop/artists/[slug]/ArtistPageClient.tsx`](../../../app/(store)/shop/artists/[slug]/ArtistPageClient.tsx) |
| Product layout (metadata + JSON-LD) | [`app/(store)/shop/[handle]/layout.tsx`](../../../app/(store)/shop/[handle]/layout.tsx) |
| JSON-LD primitives | [`components/seo/JsonLd.tsx`](../../../components/seo/JsonLd.tsx) |
| Artist API | [`app/api/shop/artists/[slug]/route.ts`](../../../app/api/shop/artists/[slug]/route.ts) |

## Testing / verification

- **Build:** `npm run build` (sitemap generation must succeed).
- **Rich Results Test:** [Google Rich Results Test](https://search.google.com/test/rich-results) on a live artist URL and PDP (JavaScript-rendered pages OK; validate JSON-LD in HTML).
- **Search Console:** URL inspection for `/shop/artists/{slug}` and `/shop/{handle}` after deploy.
- **Optional:** Lighthouse (SEO category) on the same URLs.

## Change log

| Version | Date | Notes |
|---------|------|--------|
| 1.1.0 | 2026-04-19 | Root default metadata aligned with Street Collector; blog index layout metadata; `noindex` on admin/vendor/collector/auth shells; sitemap ISR + canonical hub (`/shop/street-collector` only, no duplicate `/`); product `lastModified` from Shopify `updatedAt`; Storefront `ProductCardFields` includes `updatedAt`. |
| 1.0.0 | 2026-04-04 | Initial shop SEO stack: robots, sitemap, llms.txt, server metadata, JSON-LD, FAQ alignment, GEO answer-first blocks, explore-artists hub copy, `/shop/artists` → explore redirect. |

## Known limitations

- Sitemap uses `revalidate = 3600` (hourly ISR); product rows use Shopify `updatedAt` for `lastModified` when present.
- Sitemap product URLs are capped by paginating Shopify `getProducts` (see `app/sitemap.ts`); raise `maxPages` if the catalog grows beyond the loop.
- `StreetCollectorBrandJsonLd` emits **Organization** only; on-page FAQs remain in `StreetCollectorFAQ` without duplicate FAQ schema to avoid copy drift.

## Related

- Explore artists feature: [`explore-artists/README.md`](explore-artists/README.md)
- Artist content specs: [`artist-profile-content-spec.md`](artist-profile-content-spec.md)
