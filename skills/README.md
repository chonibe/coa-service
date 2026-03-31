# Skills (source of truth)

Project agent skills for **Cursor** and packable **Claude** `.skill` bundles share one canonical tree: **`./skills/<skill-name>/`**.

| Location | Purpose |
|----------|---------|
| `skills/<name>/SKILL.md` | **Edit here** — YAML frontmatter + body |
| `skills/<name>/references/`, `reference.md`, etc. | Supporting files (linked from SKILL.md) |
| `skills/_sync-manifest.json` | Maps rare cases to Cursor layout (e.g. single-file skills) |
| `.cursor/skills/` | **Generated** — run sync after changing `skills/` |
| `artifacts/claude-skills/*.skill` | **Generated** zips for Claude Desktop / Cowork-style install |

## UI polish (ibelick/ui-skills)

MIT-licensed skills vendored from [ibelick/ui-skills](https://github.com/ibelick/ui-skills): [`baseline-ui`](./baseline-ui/SKILL.md), [`fixing-accessibility`](./fixing-accessibility/SKILL.md), [`fixing-metadata`](./fixing-metadata/SKILL.md), [`fixing-motion-performance`](./fixing-motion-performance/SKILL.md). Upstream install: `npx skills add ibelick/ui-skills`.

## Commands (from repo root)

```bash
npm run skills:sync              # skills/ → .cursor/skills/
npm run skills:import            # .cursor/skills/ → skills/ (when you edited in Cursor)
npm run skills:pack              # all skills → artifacts/claude-skills/*.skill
npm run skills:pack -- skill-evolver   # one bundle
```

Requires `/usr/bin/zip` (macOS) or `zip` on PATH for `pack`.

## Workflow

1. Change content under **`skills/`** (commit these files).
2. Run **`npm run skills:sync`** so Cursor loads the same text.
3. For Claude, run **`npm run skills:pack`** and install the generated `.skill` from `artifacts/claude-skills/`.

If you only edited under **`.cursor/skills/`**, run **`npm run skills:import`** once to pull back into `skills/`, then treat `skills/` as canonical going forward.

## Headless evolution

`npm run skill-evolution:run` reads transcripts and proposes updates under `docs/dev/skill-evolution/...`; with `SKILL_EVOLUTION_APPLY=1` it writes **`skills/`** and runs **`skills:sync`** unless `SKILL_EVOLUTION_SYNC_CURSOR=0`.

## Implementation

- Sync / pack: [`scripts/sync-skills.mjs`](../scripts/sync-skills.mjs)
- Automated evolver: [`scripts/run-skill-evolution-automated.mjs`](../scripts/run-skill-evolution-automated.mjs)

## Org hub (many machines / CLIs)

Run a small **skills hub** so laptops, CI, and other nodes share the same catalog:

- **Server:** `npm run skills:hub` (see [`tools/skills-hub/.env.example`](../tools/skills-hub/.env.example))
- **Client:** `SKILLS_HUB_URL` + `SKILLS_HUB_TOKEN` → `npm run skills:org:pull` / `publish` / `push-proposal`

Full API and security notes: [`docs/features/skills-hub/README.md`](../docs/features/skills-hub/README.md).

## How Claude knows this setup

1. **Claude Code / repo-aware Claude** — This repo includes **[`CLAUDE.md`](../CLAUDE.md)** at the root. Many tools load it automatically when the project is open; if not, `@CLAUDE.md` or “read CLAUDE.md” in the first message.
2. **Claude.ai Projects** — Add a **Project knowledge** file: upload or paste the contents of `CLAUDE.md`, or paste the block below into **Custom instructions**.
3. **Copy-paste blurb** (minimal):

   ```text
   Skills for this repo live under skills/<name>/SKILL.md (canonical, in git). .cursor/skills/ is synced from skills/ via npm run skills:sync. To share skills with Claude as .skill bundles: npm run skills:pack, then install artifacts/claude-skills/*.skill. If edits landed only in .cursor/skills/, run npm run skills:import first. See CLAUDE.md and skills/README.md.
   ```

4. **After you change `skills/` in Claude** — If the session cannot run npm, note the diff for the human to run `npm run skills:sync` (Cursor) and/or `npm run skills:pack` (Claude bundles).
