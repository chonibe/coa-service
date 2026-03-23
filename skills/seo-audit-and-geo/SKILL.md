---
name: seo-audit-and-geo
description: >-
  Runs technical SEO, on-page, E-E-A-T, JSON-LD schema, sitemap/hreflang, programmatic-SEO,
  and AI-search (GEO) reviews in this repo, aligned with AgriciDaniel/claude-seo. Use when the
  user asks for SEO audits, Core Web Vitals, metadata, robots/sitemap, structured data, thin
  content, internal linking, comparison pages, hreflang, or optimization for AI Overviews and
  answer engines.
---

# SEO audit and GEO (claude-seo–style)

This skill adapts the workflow and quality bar of [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) for **Cursor**: no `/seo` slash commands—use the checklists and outputs below. For the full Claude Code plugin (subagents, installers, DataForSEO extension), install from that repository.

## Single source of truth

- **Edit only** `skills/seo-audit-and-geo/` in this repo (`SKILL.md`, `reference.md`).
- After changes, run **`npm run skills:sync`** so `.cursor/skills/seo-audit-and-geo/` matches (generated; do not hand-edit as canonical).
- **Do not** maintain a second copy under `~/.cursor/skills/` for this project—avoid drift.

## Scope map (pick one primary focus per pass)

| Focus | Typical inputs | Typical code / config touchpoints |
|-------|----------------|-----------------------------------|
| Technical | URLs, env, crawl issues | `middleware`, `robots`, redirects, `sitemap`, headers, canonicals |
| On-page | Routes, templates | titles, descriptions, H1/H2, OG/Twitter, content depth |
| Schema | Product/article/video pages | JSON-LD in layout or components |
| Sitemap / indexation | Dynamic routes | `sitemap.ts`, `robots.ts`, noindex rules |
| GEO / AEO | Key landing pages | clear entities, FAQs where appropriate, factual summaries |
| Programmatic | Many similar URLs | templates, uniqueness, canonicals, crawl budget |

## Workflow (default)

1. **Clarify**: staging vs production URL, locale(s), and whether the goal is audit-only or implementation.
2. **Inventory**: find framework metadata (e.g. Next.js `metadata`, `generateMetadata`), `sitemap` / `robots` config if present, layout shells, and any JSON-LD components—adapt names to the stack in this repo.
3. **Measure when possible**: if Lighthouse MCP (`user-lighthouse`) is available, run audits on representative URLs (home, top template, slow page). Otherwise infer from code and suggest manual checks.
4. **Evaluate**: apply thresholds and gates in [reference.md](reference.md).
5. **Deliver**: use the report template below; separate **must-fix**, **should-fix**, **nice-to-have**.

## Report template

```markdown
# SEO / GEO summary — [site or section]

## Executive summary
[2–4 sentences: risk, opportunity, indexation angle]

## Technical
- Crawl/index: ...
- Performance (if measured): LCP / INP / CLS — ...
- Mobile / UX blockers: ...

## On-page
- Title/description patterns: ...
- Headings & content depth: ...

## Schema
- Present types: ...
- Gaps / invalid patterns: ...

## GEO / AI visibility
- Entity clarity, summaries, citation-friendly structure: ...

## Recommendations (prioritized)
1. [Must-fix] ...
2. [Should-fix] ...
3. [Nice-to-have] ...
```

## Implementation priorities (Next.js / App Router)

This repo uses Next.js App Router for most storefront surfaces. When auditing or changing those routes:

- Prefer **one canonical source** for title/description (metadata API or shared helper).
- **JSON-LD**: valid `@context`, `@type`, required fields per type; avoid conflicting duplicates on one URL.
- **Robots/sitemap**: align `noindex` with staging; exclude junk parameter URLs where applicable.
- **Internationalization**: self-referencing `hreflang`, `x-default`, reciprocal links—see [reference.md](reference.md).

For other stacks in the monorepo, apply the same principles using that framework’s metadata and routing APIs.

## Quality gates (summary)

- Large batches of near-duplicate URLs: flag **thin content** and **cannibalization**; propose canonicals or consolidation.
- Location-style pages: treat large counts as higher risk (see reference.md for scale guidance).
- **Deprecation / restrictions**: stay conservative with FAQ/HowTo schema; prefer current Google documentation when in doubt.

## Optional upstream install

Claude Code users can install the full skill pack (Python, sub-skills, MCP extensions) via the [claude-seo README](https://github.com/AgriciDaniel/claude-seo/blob/main/README.md). This Cursor skill stays **repo- and agent-driven** only (canonical under `skills/seo-audit-and-geo/`).

## Further detail

- Thresholds, E-E-A-T dimensions, schema notes: [reference.md](reference.md)
