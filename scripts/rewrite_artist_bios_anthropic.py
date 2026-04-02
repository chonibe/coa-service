#!/usr/bin/env python3
"""
Rewrite heroHook + storyFullText for artists in content/artist-research-data.json using an LLM.

API (first match wins):
  1) ANTHROPIC_API_KEY — Anthropic Messages API (optional ANTHROPIC_MODEL, default Haiku)
  2) GROQ_API_KEY — Groq OpenAI-compatible API (optional GROQ_MODEL, default llama-3.3-70b-versatile)

Loads env from ./.env.local and ~/.config/coa-service/skill-evolution.env when present
(without overwriting variables already set in the shell).

Usage:
  python3 scripts/rewrite_artist_bios_anthropic.py
  python3 scripts/rewrite_artist_bios_anthropic.py --limit 5
  python3 scripts/rewrite_artist_bios_anthropic.py --slug marylou-faure
  python3 scripts/rewrite_artist_bios_anthropic.py --dry-run

After a full run, optionally:
  python3 scripts/refine_artist_research_bios_for_shop.py --sanitize-history-only
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
JSON_PATH = REPO / "content/artist-research-data.json"
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"

COLLECTION_RE = re.compile(
    r"https?://(?:www\.)?thestreetcollector\.com/collections/([a-z0-9][-a-z0-9]*)",
    re.I,
)


def vendor_handle(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$", line)
        if not m:
            continue
        k, v = m.group(1), m.group(2).strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        if k not in os.environ:
            os.environ[k] = v


SYSTEM = """You write artist profile copy for Street Collector (thestreetcollector.com), a shop selling limited art editions.

Output rules:
- Return ONE JSON object only (no markdown code fences). Keys: "heroHook" (string), "storyFullText" (string).
- heroHook: about 120–180 characters. Third person. Include @instagramHandle in parentheses when one is provided in the user message. One vivid line: place, medium, or stance. NO citations ("per Magazine"), NO "CV lists", NO URLs.
- storyFullText: 3–5 short paragraphs for the public shop bio, separated by two newline characters between paragraphs (blank line between paragraphs). Plain text only.
- Voice: confident magazine feature; third person. Story first: practice, place, how they work, what the work tends to do for a viewer.
- Do NOT cite magazines, blogs, portfolios, or CVs as sources in the prose ("According to...", "X writes...", "her site lists..."). Do NOT name-drop outlets for credibility. You may state facts directly when they appear in SOURCE FACTS.
- Do NOT invent exhibitions, awards, clients, or quotes. If SOURCE FACTS are thin, write a shorter honest bio (2–3 paragraphs) and do not pad with guesses.
- Optional: ONE short verbatim quote from the artist ONLY if it appears inside SOURCE FACTS in quotation marks or clearly as their words; otherwise use no quotation marks in the story.
- No HTML. No bullet lists in storyFullText.
- Do not mention Street Collector or Street Lamp unless SOURCE FACTS explicitly describe this partnership; default is to end on the artist's practice."""


def truncate(s: str, max_len: int) -> str:
    s = (s or "").strip()
    if len(s) <= max_len:
        return s
    return s[: max_len - 24] + "\n\n[truncated]\n"


def build_user_message(slug: str, row: dict[str, str]) -> str:
    name = row.get("artistName") or slug
    parts = [
        f"SLUG: {slug}",
        f"DISPLAY_NAME: {name}",
    ]
    for key in ("location", "activeSince", "instagramHandle", "editionCopy"):
        v = (row.get(key) or "").strip()
        if v:
            parts.append(f"{key.upper()}: {v}")
    parts.append("")
    parts.append("CURRENT_HERO_HOOK (rewrite from scratch; may be broken):")
    parts.append(row.get("heroHook") or "(empty)")
    parts.append("")
    parts.append("CURRENT_STORY_FULL_TEXT (rewrite from scratch; may be broken):")
    parts.append(row.get("storyFullText") or "(empty)")
    parts.append("")
    parts.append(
        "SOURCE_FACTS (use only for factual grounding; do not describe these as 'sources' or cite outlet names in the bio prose):"
    )
    parts.append("exhibitionsText:")
    parts.append(truncate(row.get("exhibitionsText") or "", 2500))
    parts.append("")
    parts.append("pressText:")
    parts.append(truncate(row.get("pressText") or "", 2500))
    parts.append("")
    parts.append("additionalHistoryText (internal; facts only, may be empty):")
    parts.append(truncate(row.get("additionalHistoryText") or "", 1500))
    return "\n".join(parts)


def extract_json_object(text: str) -> dict[str, str]:
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    raw = fence.group(1).strip() if fence else text.strip()
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object in model output")
    return json.loads(raw[start : end + 1])


def call_anthropic(api_key: str, model: str, user_msg: str) -> str:
    body = {
        "model": model,
        "max_tokens": 4096,
        "system": SYSTEM,
        "messages": [{"role": "user", "content": user_msg}],
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=data,
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        resp_body = json.loads(resp.read().decode())
    blocks = resp_body.get("content") or []
    for b in blocks:
        if b.get("type") == "text":
            return b.get("text") or ""
    return ""


def call_groq(api_key: str, model: str, user_msg: str) -> str:
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {
                "role": "user",
                "content": user_msg + "\n\nReply with ONLY a single valid JSON object. No markdown fences.",
            },
        ],
        "max_tokens": 4096,
        "temperature": 0.65,
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=data,
        headers={
            "content-type": "application/json",
            "authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        resp_body = json.loads(resp.read().decode())
    choices = resp_body.get("choices") or []
    if not choices:
        return ""
    msg = choices[0].get("message") or {}
    return (msg.get("content") or "").strip()


def sync_csv(data: dict[str, dict[str, str]]) -> None:
    if not CSV_PATH.exists():
        print(f"Skip CSV sync: missing {CSV_PATH}")
        return
    rows: list[dict[str, str]] = []
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise SystemExit("CSV has no header")
        for row in reader:
            name = (row.get("Artist Name") or "").strip()
            if not name:
                rows.append(row)
                continue
            slugs: set[str] = {vendor_handle(name)}
            src = (row.get("Sources (Links)") or "").strip()
            for m in COLLECTION_RE.finditer(src):
                slugs.add(m.group(1).lower())
            ref: dict[str, str] | None = None
            for s in slugs:
                if s in data:
                    ref = data[s]
                    break
            if ref:
                row["Hero Hook"] = ref.get("heroHook") or ""
                row["Story (Full Text)"] = ref.get("storyFullText") or ""
                row["Notes"] = ref.get("notes") or ""
            rows.append(row)

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        w.writerows(rows)
    print(f"Synced {len(rows)} CSV rows -> {CSV_PATH}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="Max artists to process (0 = all)")
    ap.add_argument("--slug", type=str, default="", help="Only this slug")
    ap.add_argument("--sleep", type=float, default=0.45, help="Seconds between API calls")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    load_env_file(Path.home() / ".config" / "coa-service" / "skill-evolution.env")
    load_env_file(REPO / ".env.local")

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    provider = ""
    api_key = ""
    model = ""
    if anthropic_key:
        provider = "anthropic"
        api_key = anthropic_key
        model = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022").strip()
    elif groq_key:
        provider = "groq"
        api_key = groq_key
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

    if not provider and not args.dry_run:
        raise SystemExit(
            "No LLM API key found. Set one of:\n"
            "  ANTHROPIC_API_KEY  (optional ANTHROPIC_MODEL)\n"
            "  GROQ_API_KEY       (optional GROQ_MODEL, default llama-3.3-70b-versatile)\n"
            "Or add keys to .env.local / ~/.config/coa-service/skill-evolution.env\n"
            "  python3 scripts/rewrite_artist_bios_anthropic.py"
        )

    def llm_call(um: str) -> str:
        if provider == "anthropic":
            return call_anthropic(api_key, model, um)
        return call_groq(api_key, model, um)

    via = "Anthropic" if provider == "anthropic" else "Groq"

    data: dict[str, dict[str, str]] = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    slugs = sorted(data.keys())
    if args.slug:
        if args.slug not in data:
            raise SystemExit(f"Unknown slug: {args.slug}")
        slugs = [args.slug]
    elif args.limit > 0:
        slugs = slugs[: args.limit]

    done = 0
    errors: list[tuple[str, str]] = []
    for slug in slugs:
        row = data[slug]
        user_msg = build_user_message(slug, row)
        if args.dry_run:
            print(f"[dry-run] {slug} ({len(user_msg)} chars context)")
            done += 1
            continue
        for attempt in range(3):
            try:
                text = llm_call(user_msg)
                out = extract_json_object(text)
                hero = (out.get("heroHook") or "").strip()
                story = (out.get("storyFullText") or "").strip()
                if not hero or not story:
                    raise ValueError("empty heroHook or storyFullText")
                row["heroHook"] = hero
                row["storyFullText"] = story
                note = (row.get("notes") or "").strip()
                tag = (
                    f"\n\n[Bio LLM rewrite 2026-04-02: hero + story regenerated via {via}; "
                    "verify facts against press/CV.]"
                )
                if "Bio LLM rewrite 2026-04-02" not in note:
                    row["notes"] = (note + tag).strip()
                JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print(f"OK {slug}")
                done += 1
                break
            except urllib.error.HTTPError as e:
                err_body = e.read().decode(errors="replace")[:800]
                err = f"HTTP {e.code}: {err_body}"
                if attempt == 2:
                    errors.append((slug, err))
                    print(f"FAIL {slug}: {err[:200]}")
                else:
                    time.sleep(2**attempt)
            except (urllib.error.URLError, ValueError, json.JSONDecodeError, OSError) as e:
                err = str(e)
                if attempt == 2:
                    errors.append((slug, err))
                    print(f"FAIL {slug}: {err[:200]}")
                else:
                    time.sleep(2**attempt)
        time.sleep(args.sleep)

    if not args.dry_run:
        sync_csv(data)
    print(f"Done. Processed {done}/{len(slugs)} slugs. Errors: {len(errors)}")
    if errors:
        for s, e in errors[:15]:
            print(f"  - {s}: {e[:160]}")


if __name__ == "__main__":
    main()
