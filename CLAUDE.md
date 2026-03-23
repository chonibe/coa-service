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

---

## Getting **Claude** to use this (not only Cursor)

**1. Same repo open in Claude Code (or any tool that reads the project)**  
Treat **`skills/`** as canonical: read and edit files there. This file (**`CLAUDE.md`**) plus **`skills/README.md`** tell you the workflow. After hub **`skills:org:pull`**, run **`npm run skills:pack`** if you need **`.skill`** files for another Claude app.

**2. Claude Desktop / mobile / web Projects**  
- Add **project knowledge**: upload **`CLAUDE.md`** (or **`skills/README.md`**).  
- For **Skills** (or “custom skills” / `.skill` installs, depending on product): run **`npm run skills:pack`** locally, then install each **`artifacts/claude-skills/<name>.skill`** the way your Claude client expects. Re-pack after **`skills/`** changes.

**3. Stay aligned with the org hub**  
On any machine before a longer session: **`npm run skills:org:pull`** (with **`SKILLS_HUB_URL`** + **`SKILLS_HUB_TOKEN`** set), then edit **`skills/`**. To propose org-wide changes without publishing: **`npm run skills:org:push-proposal -- --message "…"`**.

---

## Getting **Claude** to **evolve** skills too

Evolution means: learn from transcripts or from explicit feedback, then **edit `skills/*/SKILL.md`** (and references), keeping YAML frontmatter valid.

**A — Interactive (Claude in the loop)**  
1. Ensure **`skills/`** is up to date (pull from git or **`skills:org:pull`**).  
2. Open **[`skills/skill-evolver/SKILL.md`](skills/skill-evolver/SKILL.md)** and follow that workflow: analyze conversation or pasted transcript excerpts, map insights to skill names under **`skills/`**, apply **surgical** edits to those files.  
3. Run **`npm run skills:pack`** (for Claude bundles) and/or **`npm run skills:org:push-proposal`** (for hub review). Cursor users run **`npm run skills:sync`** after you change **`skills/`**.

**B — Automated (Anthropic API, no chat UI)**  
From repo root: **`npm run skill-evolution:run`** with **`ANTHROPIC_API_KEY`** set (see **`scripts/skill-evolution.env.example`**). It writes **`docs/dev/skill-evolution/run-…/changelog.md`** and optional applies to **`skills/`** + syncs Cursor when configured. This uses **Cursor transcript JSONL** on disk; run it on a machine that actually has those transcripts, or extend the script later to accept other transcript sources.

**C — Org-wide**  
After Claude (or anyone) improves **`skills/`**, merge via git and/or **`skills:org:publish`** on the hub so other teams **`pull`** the same version.
