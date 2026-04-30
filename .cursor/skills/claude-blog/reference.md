# claude-blog — reference

Upstream: [AgriciDaniel/claude-blog](https://github.com/AgriciDaniel/claude-blog) (MIT). Docs: [INSTALLATION](https://github.com/AgriciDaniel/claude-blog/blob/main/docs/INSTALLATION.md), [COMMANDS](https://github.com/AgriciDaniel/claude-blog/blob/main/docs/COMMANDS.md), [ARCHITECTURE](https://github.com/AgriciDaniel/claude-blog/blob/main/docs/ARCHITECTURE.md), [TEMPLATES](https://github.com/AgriciDaniel/claude-blog/blob/main/docs/TEMPLATES.md), [TROUBLESHOOTING](https://github.com/AgriciDaniel/claude-blog/blob/main/docs/TROUBLESHOOTING.md), [MCP-INTEGRATION](https://github.com/AgriciDaniel/claude-blog/blob/main/docs/MCP-INTEGRATION.md).

## Claude Code commands (parity labels)

Use these labels when the user mentions slash commands; implement behavior in Cursor as described in `SKILL.md`.

| Command | Role |
|---------|------|
| `/blog write` | New article from topic |
| `/blog rewrite` | Optimize existing post |
| `/blog analyze` | 0–100 audit |
| `/blog brief` | Content brief |
| `/blog calendar` | Editorial calendar |
| `/blog strategy` | Niche strategy / ideation |
| `/blog outline` | SERP-informed outline |
| `/blog seo-check` | On-page SEO validation |
| `/blog schema` | JSON-LD |
| `/blog repurpose` | Multi-channel derivatives |
| `/blog geo` | AI citation readiness |
| `/blog image` | Gemini / stock workflows (upstream) |
| `/blog audit` | Site/folder health |
| `/blog cannibalization` | KW overlap |
| `/blog factcheck` | Stats vs sources |
| `/blog persona` | Voice profiles |
| `/blog taxonomy` | CMS tags/categories |
| `/blog notebooklm` | NotebookLM scripts (upstream) |
| `/blog audio` | TTS scripts (upstream) |
| `/blog google` | PSI, CrUX, GSC, GA4, etc. (upstream) |

Internal upstream sub-skills: `blog-chart` (SVG), `blog-image` (callable from write/rewrite).

## 12 content templates

Auto-select by intent (name the pick in outputs): how-to, listicle, case study, comparison, pillar page, product review, thought leadership, roundup, tutorial, news analysis, data research, FAQ knowledge base.

## 5-category scoring (100 points)

| Category | Max | Focus |
|----------|-----|--------|
| Content quality | 30 | Depth, readability, originality, engagement |
| SEO | 25 | Headings, title, keywords, links, meta |
| E-E-A-T | 15 | Author, citations, trust, experience |
| Technical | 15 | Schema, images, speed/mobile/OG mentions in content specs |
| AI citation readiness | 15 | Citability, Q&A, entity clarity |

**Bands:** Exceptional 90–100, Strong 80–89, Acceptable 70–79, Below Standard 60–69, Rewrite: below 60.

## AI prose heuristics (align with upstream)

When editing: avoid bland symmetric paragraphs; inject specifics, numbers (sourced), and concrete examples; watch for stock transitions (“Moreover,” “In conclusion,” “delve”) and generic list padding. Upstream maintains phrase lists and burstiness/TTR scoring in tooling—mirror the *spirit* when no script runs.

## Python analysis (optional)

If the user clones claude-blog: `scripts/analyze_blog.py` (+ `requirements.txt`) powers automated scoring; Python 3.11+. Invite them to run it locally when they need parity with `/blog analyze`.

## Companion skills (upstream README)

Published-page depth: `/seo`, `/seo-schema`, `/seo-geo`, `/seo-google`. **In this repo**, use **`seo-audit-and-geo`** (+ **`fixing-metadata`**) instead of cloning those plugins.

## Cursor vs Claude Code

- **Cursor**: follow `SKILL.md` workflows and templates; link to upstream for MCP/installers.
- **Claude Code**: plugin marketplace `claude-blog@AgriciDaniel-claude-blog` or `install.sh` / `install.ps1`.

## Version

- **lastUpdated**: 2026-04-30
- **version**: 1.0.0
- **upstream**: pinned conceptually to claude-blog main; verify breaking changes via upstream CHANGELOG when debugging parity issues.
