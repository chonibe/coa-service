#!/usr/bin/env python3
"""
1. Remove retail / third-party shop links from pressText (keep magazines, blogs, museums, interviews).
2. Clean internal research notes from pullQuote.
3. Append one short "Recent recognition…" paragraph to storyFullText from sanitized press + exhibitions + (light) impactCallout.

Run from repo root:
  python3 scripts/sanitize_press_and_enrich_bios.py
  python3 scripts/refine_artist_research_bios_for_shop.py   # optional: activeSince + CSV sync
"""
from __future__ import annotations

import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
JSON_PATH = REPO / "content" / "artist-research-data.json"

# URL path/host fragments → treat line as retail / marketplace / print-on-demand, not editorial press
SHOP_RE = re.compile(
    r"(etsy\.|society6\.|gumroad\.|redbubble\.|goodmoodprints\.|peopleofprint\.com|members\.peopleofprint|"
    r"saatchiart\.|displate\.|inprnt\.|threadless\.|zazzle\.|fineartamerica|amazon\.(com|co\.|de|uk)|bigcartel\.|"
    r"venusurbanart\.com|outline-editions\.co\.uk/collections|sergeantpaper\.com/en/collections|"
    r"wallbaby\.|linktr\.ee|featureco\.|icanvas\.|printful\.|teespring\.|myminifactory\.|printify\.|"
    r"spreadshirt\.|redbubble\.|teepublic\.|bonfire\.|spring\.|fourthwall\.|shopify\.com/collections|"
    r"edenkalif\.com/cdn/shop|/cart|/checkout|\?.*variant=)",
    re.I,
)

# Whole-line drops (no URL needed)
LINE_DROP_RE = re.compile(
    r"primarily marketplace|portfolio listing|member profile|print collection —|print editions —|"
    r"artist collection —|rather than editorial",
    re.I,
)

HIGHLIGHTS_LEAD = "Recent recognition includes"


def sanitize_press_line(line: str) -> bool:
    """Return True to keep line."""
    s = line.strip()
    if not s:
        return False
    if LINE_DROP_RE.search(s):
        return False
    urls = re.findall(r"https?://[^\s]+", s)
    for u in urls:
        if SHOP_RE.search(u):
            return False
    # Lines that are only a shop name + product wording, no http (rare)
    if re.search(r"GoodMood Prints|People of Print member", s, re.I) and "http" not in s:
        return False
    return True


def clean_pull_quote(s: str) -> str:
    if not s.strip():
        return s
    t = s.strip()
    t = re.sub(r"\s*\([^)]*\bnote\b[^)]*\)\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*\([^)]*\bverify\b[^)]*\)\s*$", "", t, flags=re.I)
    t = re.sub(r"\s*\(note typo[^)]*\)", "", t, flags=re.I)
    t = re.sub(r"\s+—\s*Artinrug artist page.*$", "", t, flags=re.I)
    return t.strip()


def _outlet_from_chunk(chunk: str) -> str:
    chunk = chunk.strip()
    if not chunk:
        return ""
    # "CBC Arts (2025)" → CBC Arts; strip trailing parenthetical years
    chunk = re.sub(r"\s*\(\d{4}[^)]*\)\s*$", "", chunk).strip()
    # Quoted article titles break the tight name regex — keep outlet before the quote
    if re.search(r'[\u201c"]', chunk):
        chunk = re.split(r'[\u201c"]', chunk, 1)[0].strip()
    chunk = re.sub(r"\s+profile\s*$", "", chunk, flags=re.I).strip()
    m = re.match(r"^([A-Za-z0-9][A-Za-z0-9\s&'.-]+?)(?:\s*[—–]|$)", chunk)
    if m:
        return m.group(1).strip()
    return chunk[:72].rsplit(" ", 1)[0].strip() if len(chunk) > 72 else chunk


def press_outlets(press_text: str, max_n: int = 4) -> list[str]:
    out: list[str] = []
    for line in press_text.split("\n"):
        if not sanitize_press_line(line):
            continue
        line = line.strip()
        parts = re.split(r"\s+[—–-]\s+", line, 1)
        if len(parts) >= 2:
            name = parts[0].strip()
        else:
            # Semicolon-separated editorial bullets (no em dash)
            chunks = [c.strip() for c in line.split(";") if c.strip()]
            if not chunks:
                continue
            for ch in chunks:
                name = _outlet_from_chunk(ch)
                if not name or name.lower() in ("behance", "dribbble", "linkedin"):
                    continue
                if name.lower() not in [x.lower() for x in out]:
                    out.append(name)
                if len(out) >= max_n:
                    return out
            continue
        if not name or name.lower() in ("behance", "dribbble", "linkedin"):
            continue
        if name.lower() not in [x.lower() for x in out]:
            out.append(name)
        if len(out) >= max_n:
            break
    return out


def exhibition_years(exhibitions_text: str, max_n: int = 3) -> list[str]:
    years: list[str] = []
    for line in (exhibitions_text or "").split("\n"):
        m = re.match(r"^(\d{4})\s", line.strip())
        if m:
            y = m.group(1)
            if y not in years:
                years.append(y)
    years.sort(reverse=True)
    return years[:max_n]


def simplify_impact(ic: str) -> str | None:
    ic = ic.strip()
    if not ic:
        return None
    low = ic.lower()
    if "marketplace" in low or "print marketplaces" in low:
        return None
    if "giphy" in low and "view count" in low:
        return "Animated work travels widely on GIPHY under their studio name."
    if len(ic) > 160:
        return ic[:157].rsplit(" ", 1)[0] + "…"
    return ic


def strip_highlights_paragraph(story: str, impact_callout: str = "") -> str:
    paras = story.split("\n\n")
    ic = (simplify_impact(impact_callout) or "").strip().lower()
    kept: list[str] = []
    for p in paras:
        ps = p.strip()
        if ps.startswith(HIGHLIGHTS_LEAD):
            continue
        psl = ps.lower().replace("\n", " ")
        if ic and (psl == ic or (ic in psl and len(ps) <= len(ic) + 30)):
            continue
        kept.append(p)
    return "\n\n".join(kept).strip()


def _impact_overlaps_story(impact: str, base_story: str) -> bool:
    """Avoid a lone impact paragraph that repeats words already in the bio body."""
    if not impact or not base_story.strip():
        return False
    tokens = re.findall(r"[a-z]{4,}", impact.lower())
    bl = base_story.lower()
    hits = sum(1 for t in tokens[:8] if t in bl)
    return hits >= 2


def build_highlights(
    press_text: str,
    exhibitions_text: str,
    impact_callout: str,
    base_story: str = "",
) -> str | None:
    outlets = press_outlets(press_text)
    years = exhibition_years(exhibitions_text)
    impact = simplify_impact(impact_callout)
    if impact and not outlets and len(years) < 2 and _impact_overlaps_story(impact, base_story):
        impact = None

    sentences: list[str] = []
    if outlets:
        if len(outlets) == 1:
            sentences.append(f"{HIGHLIGHTS_LEAD} discussion in {outlets[0]}.")
        elif len(outlets) == 2:
            sentences.append(f"{HIGHLIGHTS_LEAD} discussion in {outlets[0]} and {outlets[1]}.")
        else:
            sentences.append(
                f"{HIGHLIGHTS_LEAD} discussion in {', '.join(outlets[:-1])}, and {outlets[-1]}."
            )
    if len(years) >= 2:
        y = ", ".join(years)
        sentences.append(f"Recent projects on the calendar span {y}.")
    combined_preview = " ".join(sentences)
    if impact and impact not in combined_preview:
        sentences.append(impact)

    if not sentences:
        return None
    text = " ".join(sentences)
    text = re.sub(r"\.\s*\.", ".", text)
    return text


def process_row(row: dict[str, str]) -> tuple[bool, dict[str, str]]:
    changed = False
    out = dict(row)

    pt = out.get("pressText") or ""
    lines = [ln for ln in pt.split("\n") if ln.strip()]
    kept = [ln for ln in lines if sanitize_press_line(ln)]
    new_pt = "\n".join(kept).strip()
    if new_pt != pt.strip():
        out["pressText"] = new_pt
        changed = True

    pq = out.get("pullQuote") or ""
    new_pq = clean_pull_quote(pq)
    if new_pq != pq.strip():
        out["pullQuote"] = new_pq
        changed = True

    story = out.get("storyFullText") or ""
    ic_raw = out.get("impactCallout") or ""
    base = strip_highlights_paragraph(story, ic_raw)
    highlights = build_highlights(
        new_pt,
        out.get("exhibitionsText") or "",
        ic_raw,
        base_story=base,
    )
    if highlights:
        new_story = f"{base}\n\n{highlights}".strip()
    else:
        new_story = base
    if new_story != story.strip():
        out["storyFullText"] = new_story
        changed = True

    return changed, out


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    n = 0
    for slug in sorted(data.keys()):
        ch, new_row = process_row(data[slug])
        if ch:
            data[slug] = new_row
            n += 1
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {JSON_PATH}: {n} rows touched, {len(data)} slugs")


if __name__ == "__main__":
    main()
