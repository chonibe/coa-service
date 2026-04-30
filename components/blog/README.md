# Blog UI components

**Version:** 1.0 · **Last updated:** 2026-04-30  

## Overview

Small presentational pieces for `/shop/blog/[handle]` composition. Editorial “Key takeaways” / “At a glance” copy lives in [`content/seo-blog-articles.ts`](../../content/seo-blog-articles.ts) as sanitized HTML blockquotes.

## Implementation

| Component | File |
| --- | --- |
| Branded hero when no `imageUrl` | [`HeroFallback.tsx`](./HeroFallback.tsx) |
| Article layout, progress, related | [`app/(store)/shop/blog/[handle]/page.tsx`](../../app/(store)/shop/blog/[handle]/page.tsx) |

## Testing

- **Link / content QA:** `npm run blog:audit-links` (repo root).
- **Manual:** [docs/features/street-collector/blog-enrichment/README.md](../../docs/features/street-collector/blog-enrichment/README.md) staging checklist.

## Change log

- **2026-04-30:** `HeroFallback` for plan requirement “meaningful hero on every URL.”
