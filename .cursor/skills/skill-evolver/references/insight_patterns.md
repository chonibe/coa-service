# Insight patterns reference

Concrete examples of each signal type when reading Cursor **agent** transcripts (JSONL).

---

## A. Corrections and rework

### Strong signals

- User repeats the request with different wording right after a result
- Specific correction: "font bigger", "table not list", "wrong date format"
- "Close but…" / "almost, but…" — note the delta
- Same output path appears in multiple write/edit operations in one session
- "Not what I asked for" / "I already told you"

### Subtler signals

- Clarifying question mid-task that implies wrong shape of output
- Direction change after new info (may be normal—weight lower)
- "Fine for now, but next time…" — good for skill notes

### What to extract

Skill (if known) → initial failure → desired outcome → **one** instruction or example that would have prevented it.

---

## B. Token and time waste

### Script reinvention

Watch for `create_*.py`, `build_*.py`, `parse_*.py`, `extract_*.py`, long throwaway utilities. Same **class** of script across 2+ sessions for the same domain → bundle in a skill `scripts/` or doc workflow.

### Long setup

- Many installs before real work
- Repeated `ls` / `find` / `cat` to re-orient
- Long clarification threads that SKILL.md could short-circuit

### Repeated lookups

Same doc, API, or file tree explored again in a later transcript → `references/` or a pinned link in the skill.

---

## C. Repeated patterns

Worth bundling if **≥2** transcripts show the same pattern for the same concern:

- Bash sequences in the same order
- Same imports / initialization blocks
- Same 2–3 web lookups at the start of a task type

---

## D. Missing triggers (Cursor)

### Explicit mentions

User says "use the X skill", attaches a skill, or references `.cursor/skills/...` — if behavior still ignored, strengthen **description** triggers and top-of-skill **when to use** bullets.

### Manual workarounds

Agent implements a whole workflow by ad-hoc tools when a skill already documents that path (e.g. migrations skill exists but agent improvises).

### Context

Paths, file types, or user words clearly match a skill's domain but the agent never opened or followed that skill — treat as description or visibility gap.

---

## Edge cases

- **One-off** corrections ≠ skill bug; need pattern or high-severity signal.
- **Ambiguous attribution** → "Not actioned" in changelog.
- **Taste vs failure** (e.g. color preference) — optional defaults only; avoid rigid rules.
