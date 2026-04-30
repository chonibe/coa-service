# SEO / GEO Phase 1 Implementation Plan
**Goal:** Resolve the major technical SEO issues identified in GSC so that the index rate rises from ~4 % to 30‑60 % and crawl budget focuses on real content.
---
## ✅ Completed (already in code)
- Canonical tags added to product, artist, and all static shop pages.  
- `alternates.canonical` added to `experience-metadata`, artist pages, FAQ, Contact, Careers, Wholesale, Collab, Gift‑cards, For‑Business, Home‑V2, etc.  
- Sitemap `lastModified` stabilized to a static date (`STATIC_LAST_MODIFIED`).  
- Duplicate‑canonical issue‑specific pages received canonical tags.  
- `ArtistProfileJsonLd.tsx` and `artist-faqs.ts` now output proper structured data.  
---
## 📋 Next Steps
| # | Action | Owner | Due | Status |
|---|--------|-------|-----|--------|
| 1 | **Validate canonical tags on staging** – spot‑check a sample of product, artist, and static pages to ensure the `<link rel="canonical">` matches the clean path. | Front‑end dev | Today | ⬜ |
| 2 | **Add middleware / redirect rule** to strip Shopify variant query parameters (`country`, `currency`, `locale`, `variant`, `price`, etc.) from any `/shop/*` request and 301‑redirect to the same URL without those params, preserving marketing params (`utm_*`, `fbclid`, `ref`). | Back‑end dev | Tomorrow | ⬜ |
| 3 | **Deploy updated sitemap** and submit it in Google Search Console (remove old, add new, verify fetch). | SEO lead | Tomorrow | ⬜ |
| 4 | **Run URL Inspection** (≈ 20 representative URLs) for: <br>• Variant URLs with query strings <br>• Clean product URLs <br>• Artist pages with/without `vendor=` <br>• New static pages (FAQ, Contact, Careers, etc.) <br>Confirm canonical and index status. | SEO lead | +2 days | ⬜ |
| 5 | **Export & fix 404s** (44 URLs from GSC). <br>– Add 301 redirects where appropriate, update stale internal links, or add `Disallow` rules for intentionally retired URLs. | Front‑end dev | +2 days | ⬜ |
| 6 | **Audit robots.txt** (`Disallow` list) – verify the 24 blocked URLs are intentional (e.g., `/api/*`). Remove any accidental blocks. | SEO lead | +2 days | ⬜ |
| 7 | **Run Rich Results Test** on key pages (artist, product, FAQ) to ensure JSON‑LD is detected without errors. | SEO lead | +2 days | ⬜ |
| 8 | **Add commit‑log entry** in `docs/dev/commit-logs/` summarising the six file changes, GSC baseline reference, and checklist items. | Documentation owner | Immediately after deploy | ⬜ |
| 9 | **Update execution brief** (`seo-geo-phase-1-execution.md`) – tick off each technical task completed. | Project lead | After step 8 | ⬜ |
|10| **Schedule a follow‑up GSC audit** (2 weeks). Export new Coverage report and compare metrics: <br>– Indexed pages ≈ 30‑60 % <br>– Redirect issues ≈ 0 <br>– Duplicate‑canonical ≈ 0 <br>– 404s ≈ 0 <br>– Crawled → Not indexed ≤ 5 % | SEO lead | +2 weeks | ⬜ |
---
## 📈 Expected Impact
| Metric (pre‑fix) | Target after Phase 1 |
|------------------|----------------------|
| Index rate | **30 % – 60 %** (≈ 475 – 950 indexed pages) |
| Redirect issues | **0** (variant URLs 301‑redirected) |
| Duplicate‑canonical pages | **0** (canonical set on every page) |
| 404 errors | **0** (or safely redirected) |
| Robots‑blocked pages | **Only intentional** (no valuable page blocked) |
| “Crawled → Not indexed” pages | **≤ 5 %** of discovered URLs |
---
## 📅 Timeline Overview
| Day | Milestone |
|-----|-----------|
| **Day 0** | Finish step 1 (canonical validation) |
| **Day 1** | Implement middleware redirects (step 2) |
| **Day 2** | Deploy sitemap & submit to GSC (step 3) |
| **Day 3‑4** | Run URL inspection, fix 404s, audit robots.txt (steps 4‑6) |
| **Day 5** | Run Rich Results test (step 7) |
| **Day 6** | Add commit‑log & update execution brief (steps 8‑9) |
| **Day 7‑14** | Wait for Google to recrawl; monitor coverage |
| **Day 14** | Execute follow‑up GSC audit (step 10) |
---
### 📌 How to Use This Plan
1. Create the file at `docs/features/street-collector/seo-geo-phase-1-plan.md` and paste the content above.  
2. Assign owners in your project management tool (Jira, Linear, etc.) using the **Owner** column.  
3. As each task is completed, check the box in the **Status** column and add a brief note if needed.  
4. Refer to the **Expected Impact** table when reporting progress to stakeholders.
*Once the checklist is done, Phase 2 (content creation, artist‑bio scaling, internal linking) can begin with a solid crawl foundation.*