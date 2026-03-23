# Working with this repo in Claude

## Shared skills (single source of truth)

Project agent skills are **not** defined only for Cursor. The **canonical** copy lives in the repo at:

**`skills/<skill-name>/SKILL.md`** (plus `references/` or `reference.md` next to it when present).

| Path | Role |
|------|------|
| `skills/` | **Edit here** and commit. This is the shared source. |
| `.cursor/skills/` | Cursor’s copy, produced by `npm run skills:sync` from `skills/`. |
| `artifacts/claude-skills/*.skill` | Claude-style zip bundles, produced by `npm run skills:pack` (folder is gitignored). |

### What you should do

1. **Read or change skills** under **`skills/`**, not by assuming `.cursor/skills/` is authoritative (sync can overwrite it).
2. **To produce installable `.skill` files for Claude** (Desktop, Cowork-style, etc.), from repo root run:
   - `npm run skills:pack` — all skills  
   - `npm run skills:pack -- <skill-name>` — one skill  
   Then use the files under **`artifacts/claude-skills/`**.
3. **If changes were made only under `.cursor/skills/`** (e.g. another tool), run **`npm run skills:import`** once to pull them into **`skills/`** before editing further.

Full commands and edge cases (e.g. `collector-data-integrity` → flat `.md` in Cursor): **[`skills/README.md`](skills/README.md)**.

### Org / many computers

A **skills hub** (HTTP + Bearer token) lets other machines run **`npm run skills:org:pull`** to sync `./skills/` from a central host, or **`push-proposal`** to submit zips for review. See **[`docs/features/skills-hub/README.md`](docs/features/skills-hub/README.md)**.

### Headless evolution (optional)

`npm run skill-evolution:run` updates **`skills/`** and can sync to Cursor; see **`scripts/run-skill-evolution-automated.mjs`** and env vars in **`scripts/skill-evolution.env.example`**.
