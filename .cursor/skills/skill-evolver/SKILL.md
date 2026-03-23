---
name: skill-evolver
description: >-
  Reads Cursor agent transcripts (JSONL) for the workspace, extracts correction/rework, token waste,
  repeated patterns, and missing skill triggers, then applies targeted edits to project or personal
  SKILL.md files and writes a dated changelog. Use when the user asks to improve or optimize skills,
  learn from past chats, skill tune-up, skill evolution, fix under-triggering skills, compound
  behavior from usage, weekly skill maintenance, or "what we learned" from sessions.
---

# Skill evolver (Cursor)

Structured learning cycle: read past **Cursor** agent transcripts for this workspace, extract what worked and what failed, and apply **surgical** updates to installed skills. Goal: compounding gains—fewer corrections, less rediscovery, leaner skills.

This adapts the Cowork-oriented skill-evolver flow to Cursor paths and transcript format. For extra signal examples, see [references/insight_patterns.md](references/insight_patterns.md).

---

## Step 1: Locate and select transcripts

**Where transcripts live**

- Per-workspace folder (name encodes the project path), for example:
  `~/.cursor/projects/Users-streetcollector-Documents-Cursor-Projects-coa-service-main/agent-transcripts`
- Cursor may expose the exact path in session **user_info** as `Agent transcripts`—prefer that when present.
- Layout: `<uuid>/<uuid>.jsonl` for parent chats; optional `subagents/<id>.jsonl` for subagent runs.

**How to gather**

1. Resolve the `agent-transcripts` directory for **this** workspace (glob under `~/.cursor/projects/` if needed).
2. List `*.jsonl` files; use file **mtime** (or parse embedded timestamps if present) to keep transcripts from the **last 30 days**.
3. If more than **20** sessions qualify, take the **20 most recent** (prefer top-level `uuid/uuid.jsonl` over `subagents/` unless the user asked to include subagents).
4. Note each file path (and optional title from first user message) before analysis.

There is no `list_sessions` / `read_transcript` API in Cursor—use **Read** / **Grep** / shell `find` / `stat` on these files.

---

## Step 2: Read and analyze each transcript

For each selected `.jsonl`, read the conversation (JSON lines with `role` and `message`).

Extract signals in four categories (keep notes; consolidate in Step 3):

### A. Corrections and rework

- User pushback: "no", "wrong", "redo", "not what I meant", "you missed", "actually", "fix that"
- Same artifact rewritten multiple times (repeated writes to the same path)
- Mid-task pivots: "make it X instead", "I wanted Y not Z"

For each: infer which **skill or rule** was in play if obvious; failure mode; what the user actually wanted. **Why** matters more than cataloguing **what**.

### B. Token and time waste

- Long back-and-forth before a deliverable
- One-off scripts recreated across chats (`parse_*.py`, `build_*.py`, etc.) that a skill could own
- Repeated searches or re-discovery of the same repo paths or docs
- Long orientation (`ls` / `find` / wide search) before real work

### C. Repeated patterns

- Same command or tool sequence in **≥2** transcripts
- Same boilerplate code or setup repeated
- Same research lookups repeated

Candidates: add `scripts/`, `references/`, or a **common workflow** section to the relevant skill.

### D. Missing triggers

- User explicitly attached or named a skill, or said "use the X skill"
- User expected a workflow from `.cursorrules` / project rules but the agent did not follow it
- Obvious task type (e.g. migrations, SEO pass) where a project skill exists but behavior ignored the skill's path

**Cursor nuance:** Skills are injected when matched; weak **description** text in frontmatter often causes under-triggering. Prefer expanding `description` with **exact user phrases** you observe.

---

## Step 3: Map insights to skills

**Where skills live**

| Scope | Path |
|--------|------|
| Project (repo) | `<repo-root>/.cursor/skills/<skill-name>/SKILL.md` |
| Personal | `~/.cursor/skills/<skill-name>/SKILL.md` |

Do **not** create new skills under `~/.cursor/skills-cursor/` (reserved).

List installed skills with **Glob** or `ls`. Attribute each insight to one skill name, or to **Gaps** if no skill exists.

Only edit a skill when there is at least **one clear, actionable** insight. Skip skills with nothing concrete.

---

## Step 4: Apply improvements

For each targeted skill, read its `SKILL.md` and apply **small, targeted** edits (StrReplace-style), not wholesale rewrites.

| Insight type | Action |
|--------------|--------|
| Corrections / rework | Add concise guidance or a **short example** showing the right approach; explain why. |
| Token / time waste | Add quick-start at top; factor repeated code into `scripts/`; cache stable facts in `references/`. |
| Repeated patterns | Document a **common workflow** or add a script; link from SKILL.md. |
| Missing triggers | Expand YAML **`description`** with synonyms and phrases users actually used. |

**Principles**

- Prefer reasoning over piles of MUST/NEVER.
- Generalize the pattern, not one-off wording.
- Keep SKILL.md lean; if a change exceeds ~50 lines, move detail to `references/*.md` and link once.
- Do not delete good existing guidance—extend around it.
- If a path is not writable, write a patch copy under `/tmp/skill-evolver/<skill-name>/` and tell the user to copy it in.

---

## Step 5: Write a changelog

Write a report after improvements (or a deliberate "no changes"):

**Path (default):** `docs/dev/skill-evolution/skill-changelog-YYYY-MM-DD.md` in the **repo root** (create `docs/dev/skill-evolution/` if missing).

If the repo must not get docs commits, use instead: `.cursor/skills/skill-evolver/changelogs/skill-changelog-YYYY-MM-DD.md` and say so in the summary.

Use this structure:

```markdown
# Skill evolution report — [Date]

## Summary
- Transcripts analyzed: N (date range)
- Skills updated: N
- New scripts/references: N

## Changes by skill

### [skill-name]
**Insight type**: Corrections | Token waste | Repeated patterns | Missing triggers
**Pattern observed**: [what kept happening]
**Change made**: [what changed and why it helps]

## Gaps (no skill yet)
- [need + optional suggested skill name]

## Not actioned
[Brief: ambiguous, one-off, or low-signal]
```

---

## Scheduled / periodic runs

Cursor has no built-in Cowork-style scheduler. For hands-off cadence (e.g. weekly), use **OS cron**, **Calendar reminder**, or a team habit—then run this skill manually with "weekly skill evolution."

When run with no user in the loop, still write a short changelog (even if "no changes").

---

## References

- [references/insight_patterns.md](references/insight_patterns.md) — expanded signal examples and edge cases.
