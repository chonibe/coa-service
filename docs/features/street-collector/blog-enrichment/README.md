# Street Collector blog enrichment

**Purpose:** Editorial and engineering standards so `/shop/blog` posts read as deliberate magazine-grade content (dual SEO + AI citation readiness) with real heroes, truthful claims, and safe HTML rendering.

**Version:** 1.0  
**Last updated:** 2026-04-30

## Staging acceptance

Before marking a rollout wave complete, manually check the preview build:

- Listing: https://street-collector-5lz6xxfwr-chonibes-projects.vercel.app/shop/blog  
- Detail: `/shop/blog/{handle}`  

Verify: hero image loads (no gray placeholder unless intentionally uncropped), typography and blockquotes readable, CLS stable, internal links not broken. Replace the host with production when promoting.

## Editorial charter

- **Voice:** Direct, collector-literate; show respect for cities and artists without tourist filler or hype.
- **Facts:** Preserve verifiable truths from artist pages and product data. No investment promises or invented biography.
- **Persona:** Serious hobbyist collectors and design-forward buyers—not “SEO reader” shorthand.
- **Citations:** When numbers or third-party claims appear, name the source inline or soften the claim.

## Claude-blog workflow gate

Canonical workflows and scoring live in-repo:

- [skills/claude-blog/SKILL.md](../../../../skills/claude-blog/SKILL.md)  
- [skills/claude-blog/reference.md](../../../../skills/claude-blog/reference.md)

**Pipeline (per post):** Brief → template pick (see reference taxonomy) → Write/Rewrite with **AI-ish prose audit** → **five-category score gate** → media pass → ship.

**Production target:** minimum **Strong (80–89)** on the 100-point rubric in the skill; Exceptional band for marquee URLs. Below 80: iterate before wave sign-off.

**Optional automation:** Clone [AgriciDaniel/claude-blog](https://github.com/AgriciDaniel/claude-blog) locally and run `scripts/analyze_blog.py` against exported HTML/markdown when you want machine-scoring parity with the upstream plugin.

**Pilot score sheet:** Copy [PILOT_SCORECARD_TEMPLATE.md](./PILOT_SCORECARD_TEMPLATE.md) per URL for Waves 1–2 sign-off.

## Article inventory

Full handle list (templates + hero sourcing): **[INVENTORY.md](./INVENTORY.md)**.

Quick regen snippet:

```bash
# From repo root (counts factory entries)
rg -n "article\\(|artistSpotlight\\(|cityGuide\\(" content/seo-blog-articles.ts
```

Spreadsheet-ready columns: **handle**, template type, hero status (`blog-hero-manifest.ts`), scored band, Must-fix notes, `lastVerified` for media rights.

## Media manifest

Hero and inline asset metadata keyed by **`article handle`** (not Shopify blog id):

| Field | Required | Description |
|--------|----------|-------------|
| `imageUrl` | For hero rollout | Absolute URL, prefer **`cdn.shopify.com` on Street Collector store** (`1/0659/7925/2963/...`) or verified `thestreetcollector.com` |
| `imageAlt` | Yes | Describes the image; align with depicted work or branded product |
| `inline` | Optional | `{ url, alt, credit? }[]` for future structured blocks |
| `lastVerified` | Recommended | ISO date someone confirmed URL + usage rights |

**External Shopify heroes (tier 4):** When storefront collection crops are missing—as with `iain-macarthur-limited-edition-prints`—you may reference another store’s **`cdn.shopify.com`** asset **only if** it depicts the artist’s legitimate release and **`imageAlt`/README documents the merchant** (e.g. Danger Prints product still on Shopify CDN). Prefer replacing with owned photography when available.

Source file: [`content/blog-hero-manifest.ts`](../../../../content/blog-hero-manifest.ts). Add entries when collection imagery or uploads exist; omit handles that lack a truthful asset rather than mismatched photography.

**`/public/blog/` naming (optional upload path):** `{handle}-hero.webp` for future first-party heroes committed to git.

Suggested file naming elsewhere: `{handle}-hero.webp` under owned storage or Shopify Files.

## Wave checklist

- [x] **Link audit pass** — [`scripts/audit-blog-links.mjs`](../../../../scripts/audit-blog-links.mjs). Latest `npm run blog:audit-links` output: `OK — 124 href(s) across 41 article blocks in seo-blog-articles.ts.`
- [x] **Hero coverage** — [`content/blog-hero-manifest.ts`](../../../../content/blog-hero-manifest.ts); [`components/blog/HeroFallback.tsx`](../../../../components/blog/HeroFallback.tsx) (fallback when no hero in manifest).
- [x] **FAQ / schema pattern** — [`app/(store)/shop/blog/[handle]/page.tsx`](../../../../app/(store)/shop/blog/[handle]/page.tsx) (`extractFaqEntities`; `<h2>FAQ</h2>` then `<h3>` / `<p>` pairs).
- [ ] **Draft Strong 80+ band**
  - Editorial: complete [PILOT_SCORECARD_TEMPLATE](./PILOT_SCORECARD_TEMPLATE.md) per URL.
- [ ] **Preview pass on staging** — After deploy (human): [staging blog listing](https://street-collector-5lz6xxfwr-chonibes-projects.vercel.app/shop/blog), detail `/shop/blog/{handle}` ([§ Staging acceptance](#staging-acceptance)).

**Checklist status (2026-04-30):** Automated or code-complete: link audit, hero manifest + fallback, FAQ extraction. Needs human: Strong (80+) scorecards per URL and staging preview after deploy.

## Implementation reference

| Area | Primary file |
|------|----------------|
| Article bodies + export | `content/seo-blog-articles.ts` |
| Hero map | `content/blog-hero-manifest.ts` |
| Types / feed | `content/shopify-content.ts` |
| Article page | `app/(store)/shop/blog/[handle]/page.tsx` |
| Hero fallback banner | `components/blog/HeroFallback.tsx` |
| Body sanitization | `components/SanitizedHtml.tsx` |
| Link QA | `scripts/audit-blog-links.mjs` |

## Testing

- `npm run blog:audit-links` — link hygiene on blog HTML strings (**primary gate for blog PRs**).
- `npm run typecheck:collector` — TS project `tsconfig.collector.json` covering `app/api/collector/*` and related code. **It can fail independently of blog edits** when Supabase client types drift from migrations or collector routes reference columns not in generated types; fix under [`app/api/collector/`](../../../../app/api/collector/) or regenerate DB types—not in `content/` or `components/blog/`.

## CSP / security notes

[`next.config.js`](../../../../next.config.js) sets `img-src` to **`'self' data: https: blob:`**—any `https://` hero (including Shopify CDN product images) loads. **`SanitizedHtml`** allows `figure`, `figcaption`, and `table` trees for editorial tables; omit `iframe`/`script` from blog HTML strings unless you introduce a gated block renderer.

---

## Change log

- **2026-04-30:** Wave checklist: link audit + hero + FAQ marked done with evidence links; PILOT_SCORECARD + staging preview marked human/open; checklist status summary.
- **2026-04-30:** Inventory, pilot scorecard template, CSP note, tier-4 hero guidance, `HeroFallback` reference.
- **2026-04-30:** Initial enrichment README: charter, staging URL, manifest spec, wave checklist, tooling references.
