# SEO audit and GEO — reference

Aligned with concepts documented in [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo). Use as a supplement to [SKILL.md](SKILL.md); read when depth is needed.

## Core Web Vitals (targets)

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

INP replaced FID (2024). Prefer field data when available; lab data from Lighthouse is directional.

## E-E-A-T (content review lens)

- **Experience**: first-hand, specific detail; not generic filler.
- **Expertise**: author/brand signals where relevant (bio, credentials, methodology).
- **Authoritativeness**: citations, recognized entities, consistent naming.
- **Trustworthiness**: contact, policies, secure flows, transparent commerce/subscriptions.

## Schema.org (practical notes)

- Prefer **JSON-LD** in a single coherent graph per page when possible.
- Common types for commerce/content: `Organization`, `WebSite`, `Product`, `Offer`, `BreadcrumbList`, `Article`, `VideoObject`.
- **Video**: consider `VideoObject`, `Clip`, `BroadcastEvent` where applicable; match visible content.
- **FAQ / HowTo**: restricted or deprecated in some contexts—verify current Google guidance before shipping.

## GEO / AEO (generative engines)

- Lead with a **clear entity** (what/who/where) in visible copy and headings.
- Short **summary blocks** and **scannable lists** help extraction; avoid keyword stuffing.
- Align on-page facts with structured data and visible UI (no contradictions).

## Programmatic and scale

- Watch for **template-thin** pages (same word count, swapped variables only).
- **Internal linking**: hub pages, related links, avoid orphan clusters.
- **Canonical strategy**: one preferred URL per logical resource; parameter handling documented.

## Hreflang checklist

- Self-reference present.
- Reciprocal return tags across locales.
- Consistent protocol (http/https) and host.
- `x-default` where appropriate.

## Scale / quality gates (from claude-seo-style practice)

- Many location or near-duplicate landing pages: escalate review; prefer consolidation or stricter uniqueness rules.
- Programmatic sets: treat **100+** pages as needing explicit quality review; **500+** without audit is high risk.

## MCP / tools in Cursor

- **Lighthouse** (`user-lighthouse`): performance and some SEO signals for audited URLs.
- **Browser** (`cursor-ide-browser`): render checks, console errors, visible content vs metadata.
- **Web search**: current Google/Schema.org policy changes.

## Upstream

- Installation, `/seo` commands, DataForSEO and other extensions: [github.com/AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo).
