---
name: claude-blog
description: >-
  Blog content creation, optimization, and management aligned with AgriciDaniel/claude-blog:
  dual optimization for Google rankings and AI citations (GEO), quality scoring, briefs,
  outlines, schema, repurpose, fact-check, personas, and editorial workflows. Use when the
  user asks to write or rewrite blog posts, content briefs, editorial calendars, JSON-LD for
  articles, blog SEO checks, AI-citation readiness, cannibalization audits, or claude-blog-style
  commands without Claude Code plugins.
---

# Blog content (claude-blog–style)

This skill adapts the workflow and quality bar of [AgriciDaniel/claude-blog](https://github.com/AgriciDaniel/claude-blog) for **Cursor**: there are no `/blog` slash commands here—map user intent using the table below and follow the workflows in this file. For the full Claude Code plugin (installers, MCP wrappers, `analyze_blog.py` wiring), use that repository.

## Single source of truth

- **Edit only** `skills/claude-blog/` in this repo (`SKILL.md`, `reference.md`).
- After changes, run **`npm run skills:sync`** so `.cursor/skills/claude-blog/` matches.
- **Do not** maintain a duplicate under `~/.cursor/skills/` for this project unless you want a personal override.

## Intent map (Claude Code command → Cursor behavior)

| User intent (examples) | What to do |
|------------------------|------------|
| Write a new post from a topic | Follow **Write workflow**; pick template from [reference.md](reference.md); dual-optimize (SEO + GEO). |
| Rewrite / optimize an existing file | Follow **Rewrite workflow**; preserve facts; improve headings, internal links, schema hooks, citability. |
| Quality audit / score | Apply **5-category rubric** in [reference.md](reference.md); optionally run upstream `scripts/analyze_blog.py` if the user has cloned claude-blog. |
| Content brief | SERP-aware brief: audience, angle, outline, keywords, FAQs, snippets, competitors. |
| Editorial calendar | Table of pillars, topics, dates, funnel stage, CTAs—aligned to niche. |
| Strategy / ideation | Topic clusters, pillars, differentiation, monetization CTAs—no fluff lists. |
| Outline only | SERP-informed H2/H3, featured-snippet targets, FAQ block plan. |
| Post-writing SEO check | Title, meta, H1 alignment, KW placement, links, duplicates—mirror `/blog seo-check`. |
| JSON-LD for a post | Article/BlogPosting (+ FAQ/Image where warranted); validate shape. |
| Repurpose | Social threads, newsletter, Shorts/YouTube script from one asset. |
| GEO / AI citations | Answer-first passages, entities, FAQs; for **published** URL / codebase SEO+GEO audits use [seo-audit-and-geo](../seo-audit-and-geo/SKILL.md). |
| Site / folder blog audit | Inventory posts, thin content, overlaps, broken patterns—mirror `/blog audit`. |
| Cannibalization | Keyword overlap across files; merge vs differentiate recommendations. |
| Fact-check | Claims vs cited sources; flag “not verified” explicitly. |
| Personas | NNGroup-style tone dimensions + readability band; enforce consistently. |
| Taxonomy | Tags/categories consistent with CMS (WordPress, Shopify, etc.—ask which). |
| Images / charts / audio / NotebookLM / Google APIs | Prefer upstream plugin + docs; see [reference.md](reference.md) for scope and fallback. |

## Write workflow (default)

1. **Brief the gap**: audience, locale, funnel stage, primary keyword, competitor angle (user supplies or infer and label assumptions).
2. **Template**: choose one of the 12 types in [reference.md](reference.md); say which and why.
3. **Draft**: strong intro, skimmable H2s, actionable body, FAQs where appropriate, explicit authoritativeness (experience, citations) for YMYL-ish topics.
4. **Dual optimization**:
   - **Google**: clear title/H1, helpful headings, semantic coverage, sensible internal links, meta description (~150–160 chars), Core Update–style usefulness (no keyword stuffing).
   - **GEO / AI citations**: decisive lead, definition/entity clarity, excerpt-friendly paragraphs, citation-friendly factual statements (with sources when claiming numbers).
5. **AI-ish prose check**: shorten repeated cadence; replace generic AI phrases flagged in [reference.md](reference.md); vary sentence length.
6. **Deliver**: full markdown (or repo’s CMS format); list **Suggested meta title / description**; optional **JSON-LD sketch** if they want `/blog schema` parity.

## Rewrite workflow

1. Read the full draft; extract target keyword and intent (confirm with user if unclear).
2. Preserve factual claims unless user allows changes—mark unsupported stats.
3. Re-score mentally against the 5 categories; prioritize highest-impact fixes (structure, E-E-A-T, citability, meta).
4. Output: revised content + short **changelog** of structural/SEO/GEO edits.

## Quality scoring (summary)

Use the **100-point, 5-category** rubric and bands in [reference.md](reference.md). State a **single overall band** (Exceptional / Strong / Acceptable / Below Standard / Rewrite) and top 3 fixes.

## Related skills in this repo

- **Published-page technical SEO / GEO** (routes, sitemaps, CWV): [`skills/seo-audit-and-geo/SKILL.md`](../seo-audit-and-geo/SKILL.md)
- **Metadata fixes in code**: [`skills/fixing-metadata/SKILL.md`](../fixing-metadata/SKILL.md)

## Report template (analyze / audit)

```markdown
# Blog review — [title or topic]

## Executive summary
[2–4 sentences: audience fit, ranking potential, citability]

## Scores (0–100 each category)
- Content quality: … / 30
- SEO: … / 25
- E-E-A-T: … / 15
- Technical: … / 15
- AI citation readiness: … / 15
**Overall:** … / 100 — [band]

## Must-fix
1. …

## Should-fix
1. …

## Nice-to-have
1. …
```

## Additional detail

- Full command list, architecture, Python deps, and companion `/seo*` skills: [reference.md](reference.md)
