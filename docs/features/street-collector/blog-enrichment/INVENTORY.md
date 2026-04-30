# Blog article inventory (synced `/shop/blog`)

**Version:** 1.0 · **Last updated:** 2026-04-30  

Regenerate rows when handles change (`content/seo-blog-articles.ts`). Hero column reflects [`content/blog-hero-manifest.ts`](../../../../content/blog-hero-manifest.ts) after `applyBlogHeroes`.

| Handle | Template type | Hero source |
| --- | --- | --- |
| `what-is-a-limited-edition-print` | Pillar / FAQ | Store collection |
| `what-is-an-illuminated-art-display` | Explainer | Lamp collection |
| `what-is-a-backlit-art-lamp` | Explainer | Lamp collection |
| `how-to-start-collecting-street-art-prints` | How-to | Lamp collection |
| `what-is-a-certificate-of-authenticity-for-art` | FAQ knowledge | Collection |
| `street-art-prints-vs-posters` | Comparison | Collection |
| `how-numbered-art-editions-work` | Explainer | Collection |
| `gifts-for-street-art-lovers` | Listicle / guide | Collection |
| `tel-aviv-street-art-and-illustration-through-street-collector-artists` | City guide (custom article) | Collection |
| `ori-toor-limited-edition-prints` | Artist spotlight (custom) | Collection |
| `moritz-adam-schmitt-limited-edition-prints` | Artist spotlight | Collection |
| `hedof-limited-edition-prints` | Artist spotlight | Collection |
| `dawal-limited-edition-prints` | Artist spotlight | Collection |
| `maalavidaa-limited-edition-prints` | Artist spotlight | Collection |
| `loreta-isac-limited-edition-prints` | Artist spotlight | Collection |
| `what-is-a-print-run-in-art` | Pillar | Collection |
| `swappable-art-prints` | Explainer | Lamp collection |
| `are-limited-edition-prints-worth-it` | FAQ / decision | Collection |
| `street-art-vs-fine-art` | Thought leadership | Collection |
| `street-collector-vs-other-art-print-platforms` | Comparison | Collection |
| `dima-korma-limited-edition-prints` | Artist spotlight | Collection |
| `studio-giftig-limited-edition-prints` | Artist spotlight | Collection |
| `yonil-limited-edition-prints` | Artist spotlight | Collection |
| `nia-shtai-limited-edition-prints` | Artist spotlight | Collection |
| `erezoo-limited-edition-prints` | Artist spotlight | Collection |
| `laura-fridman-limited-edition-prints` | Artist spotlight | Collection |
| `unapaulogetic-limited-edition-prints` | Artist spotlight | Collection |
| `iain-macarthur-limited-edition-prints` | Artist spotlight | External product image (Danger Prints CDN) |
| `jerome-masi-limited-edition-prints` | Artist spotlight | Collection |
| `berlin-street-art-artists-street-collector` | City guide (custom) | Collection |
| `london-street-art-artists-street-collector` | City guide | Collection |
| `melbourne-street-art-artists-street-collector` | City guide | Collection |
| `amsterdam-street-art-and-illustration-artists` | City guide | Collection |
| `street-artists-who-work-best-small` | Roundup | Collection |
| `international-street-art-prints-collection` | Pillar | Collection |
| `street-art-prints-for-minimalist-interiors` | Curation | Collection |
| `bold-street-art-prints-for-maximalist-spaces` | Curation | Collection |
| `emerging-street-artists-to-collect` | Roundup | Collection |
| `how-to-frame-and-display-street-art-print` | How-to | Lamp collection |
| `street-collector-watchlist` | Product / feature explainer | Collection |
| `how-to-choose-your-first-artwork-on-street-collector` | How-to | Collection |

## Implementation links

| Area | File |
| --- | --- |
| Bodies + export | [`content/seo-blog-articles.ts`](../../../../content/seo-blog-articles.ts) |
| Hero merge | Same file (`applyBlogHeroes`) |
| Article page UI | [`app/(store)/shop/blog/[handle]/page.tsx`](../../../../app/(store)/shop/blog/[handle]/page.tsx) |
| Hero fallback | [`components/blog/HeroFallback.tsx`](../../../../components/blog/HeroFallback.tsx) |
| Link QA | Run `npm run blog:audit-links` → [`scripts/audit-blog-links.mjs`](../../../../scripts/audit-blog-links.mjs) |

## Testing

- **Automated:** `npm run blog:audit-links` → [`scripts/audit-blog-links.mjs`](../../../../scripts/audit-blog-links.mjs). **2026-04-30:** `OK — 124 href(s) across 41 article blocks in seo-blog-articles.ts.`
- **Manual:** Staging and wave sign-off in [README.md](./README.md) § Staging acceptance and § Wave checklist (editorial scorecards + human preview).

## Change log

- **2026-04-30:** Testing section aligned with README wave checklist; recorded link-audit command output.
- **2026-04-30:** Initial inventory table for enrichment drive sign-off.
