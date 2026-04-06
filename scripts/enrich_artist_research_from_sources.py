#!/usr/bin/env python3
"""
Enrich docs/features/street-collector/artist-research-sheet.csv from existing Sources (Links).

- Sets About Page URL (primary) when empty (prefers /about, /bio, /cv, etc.; else first non-social URL).
- Fetches that URL (and on soft failure, other source URLs up to 3 tries) and extracts:
  - Additional History & CV (text): education / representation / location sentences (keyword-based).
  - Exhibitions (Text List): only high-confidence lines with a 4-digit year + exhibition vocabulary.
  - Press (Text + Links): adds obvious article URLs from Sources not already listed in Press.

Uses stdlib only. Appends a short note to Notes. Idempotent-ish: re-run skips rows that already have
substantial Additional History unless --force-history.

Usage:
  python3 scripts/enrich_artist_research_from_sources.py
  python3 scripts/enrich_artist_research_from_sources.py --dry-run
  python3 scripts/enrich_artist_research_from_sources.py --force-history
"""
from __future__ import annotations

import argparse
import csv
import html
import re
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parents[1]
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"

SKIP_FETCH_HOSTS = frozenset(
    {
        "linkedin.com",
        "www.linkedin.com",
        "instagram.com",
        "www.instagram.com",
        "facebook.com",
        "www.facebook.com",
        "twitter.com",
        "www.twitter.com",
        "x.com",
        "www.x.com",
        "tiktok.com",
        "www.tiktok.com",
        "youtube.com",
        "www.youtube.com",
        "pinterest.com",
        "www.pinterest.com",
        "thestreetcollector.com",
        "www.thestreetcollector.com",
    }
)

ABOUT_HINTS = (
    "/about",
    "/bio",
    "/cv",
    "/info",
    "a-propos",
    "uber-mich",
    "uber-uns",
    "qui-sommes",
    "/about/",
    "/om/",
    "/sobre",
)

UA = (
    "Mozilla/5.0 (compatible; StreetCollectorResearch/1.0; +https://thestreetcollector.com; enrichment bot)"
)

CTX = ssl.create_default_context()

HISTORY_KEYWORDS = re.compile(
    r"\b(studied|study|studies|graduated|diploma|degree|bachelor|master|mfa|bfa|phd|academy|university|"
    r"college|école|ecole|school of|born in|based in|lives in|lives and works|studio in|founded|"
    r"represented by|representation|clients include|selected clients|freelance|illustrator|artist)\b",
    re.I,
)

YEAR_EXH = re.compile(
    r"^(19|20)\d{2}\s*[—–\-]\s*.{10,240}$",
    re.I | re.M,
)

EXH_VOCAB = re.compile(
    r"\b(exhibition|exhibited|solo|group show|biennale|biennial|fair|gallery|museum|mural|commission|"
    r"residency|vernis|opening|show at|show in)\b",
    re.I,
)


def iter_urls(sources: str) -> list[str]:
    out: list[str] = []
    for line in (sources or "").splitlines():
        u = line.strip()
        if u.lower().startswith("http"):
            out.append(u.split()[0])
    return out


def host_ok(url: str) -> bool:
    try:
        h = urlparse(url).netloc.lower()
        if h.startswith("www."):
            h = h[4:]
    except Exception:
        return False
    return h not in SKIP_FETCH_HOSTS and "linkedin.com" not in h and "instagram.com" not in h


def score_about_candidate(url: str) -> int:
    if not host_ok(url):
        return -1
    low = url.lower()
    s = 0
    for h in ABOUT_HINTS:
        if h in low:
            s += 12
    if re.search(r"/(about|bio|cv|info)(/|$|\?)", low):
        s += 8
    if "behance.net" in low:
        s += 4
    if "dribbble.com" in low:
        s += 3
    # Prefer pathful URLs over bare domain
    path = urlparse(url).path or "/"
    if path not in ("/", ""):
        s += 2
    return s


def pick_about_url(urls: list[str]) -> str:
    best = ""
    best_score = -1
    for u in urls:
        sc = score_about_candidate(u)
        if sc > best_score:
            best_score = sc
            best = u
    if best_score >= 4:
        return best
    # First non-social URL
    for u in urls:
        if host_ok(u):
            return u
    return ""


def fetch_text(url: str, max_bytes: int = 400_000) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    with urllib.request.urlopen(req, timeout=22, context=CTX) as resp:
        raw = resp.read(max_bytes)
    text = raw.decode("utf-8", errors="replace")
    # Strip scripts/styles
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", text)
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
    text = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def sentences(blob: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", blob)
    return [p.strip() for p in parts if 20 < len(p.strip()) < 500]


def extract_history(blob: str, max_sentences: int = 8, max_chars: int = 1600) -> str:
    hits: list[str] = []
    for sent in sentences(blob):
        if HISTORY_KEYWORDS.search(sent):
            hits.append(sent)
        if len(hits) >= max_sentences:
            break
    body = " ".join(hits)
    if len(body) > max_chars:
        body = body[: max_chars - 1].rsplit(" ", 1)[0] + "…"
    if not body:
        return ""
    return (
        "Auto-extracted from primary source page (verify before publishing):\n\n" + body
    )


def extract_exhibition_lines(blob: str, max_lines: int = 12) -> list[str]:
    found: list[str] = []
    for line in blob.split(". "):
        line = line.strip()
        if not re.match(r"^(19|20)\d{2}", line):
            continue
        if not EXH_VOCAB.search(line):
            continue
        if len(line) > 280:
            line = line[:277] + "…"
        # Normalize to YYYY — rest
        m = re.match(r"^((?:19|20)\d{2})\s*[—–\-:]\s*(.+)$", line, re.I)
        if m:
            found.append(f"{m.group(1)} — {m.group(2).strip()}")
        else:
            m2 = re.match(r"^((?:19|20)\d{2})\s+(.+)$", line, re.I)
            if m2 and EXH_VOCAB.search(m2.group(2)):
                found.append(f"{m2.group(1)} — {m2.group(2).strip()}")
        if len(found) >= max_lines:
            break
    # Also scan for YEAR — pattern across newlines in blob
    for m in YEAR_EXH.finditer(blob):
        seg = m.group(0).strip()
        if EXH_VOCAB.search(seg) and seg not in found:
            found.append(seg)
        if len(found) >= max_lines:
            break
    # Dedupe preserve order
    seen: set[str] = set()
    out: list[str] = []
    for x in found:
        k = x.lower()
        if k not in seen:
            seen.add(k)
            out.append(x)
    return out


def press_from_sources(sources: str, existing_press: str) -> list[str]:
    existing_low = (existing_press or "").lower()
    additions: list[str] = []
    for u in iter_urls(sources):
        low = u.lower()
        if "thestreetcollector.com" in low:
            continue
        if u.lower() in existing_low:
            continue
        if not re.search(
            r"(/blog/|/article|/news/|/features?/|/stories/|/magazine|\d{4}/\d{2}/|/20\d{2}/|\.pdf$)",
            low,
        ):
            if not re.search(
                r"(creapills|adaymag|blog\.adobe|hyperallergic|juxtapoz|widewalls|designboom|itsnicethat)",
                low,
            ):
                continue
        try:
            host = urlparse(u).netloc.replace("www.", "")
        except Exception:
            host = "Press"
        label = host.split(".")[0].title() if host else "Press"
        line = f"{label} — — See source article — {u}"
        if line.lower() not in existing_low:
            additions.append(line)
    return additions


def append_note(notes: str, extra: str) -> str:
    n = (notes or "").strip()
    if extra in n:
        return n
    return f"{n}\n{extra}".strip() if n else extra


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force-history", action="store_true", help="Replace thin auto history on re-run")
    args = ap.parse_args()

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        if not fieldnames:
            raise SystemExit("No CSV headers")
        rows = list(reader)

    stamp = "Enrichment pass 2026-04-02: About URL / fetch-based history; verify auto-extracted lines."
    updated = 0

    for row in rows:
        name = (row.get("Artist Name") or "").strip()
        if not name:
            continue
        sources = row.get("Sources (Links)") or ""
        urls = iter_urls(sources)
        if not urls:
            continue

        changed = False

        about_col = "About Page URL (primary)"
        if not (row.get(about_col) or "").strip():
            picked = pick_about_url(urls)
            if picked:
                row[about_col] = picked
                changed = True

        # Press from sources
        press_key = "Press (Text + Links)"
        ex_press = press_from_sources(sources, row.get(press_key) or "")
        if ex_press:
            cur = (row.get(press_key) or "").strip()
            row[press_key] = (cur + "\n" + "\n".join(ex_press)).strip() if cur else "\n".join(ex_press)
            changed = True

        hist_key = "Additional History & CV (text)"
        existing_hist = (row.get(hist_key) or "").strip()
        should_apply_auto = (not existing_hist) or args.force_history

        if should_apply_auto:
            fetch_urls: list[str] = []
            primary = (row.get(about_col) or "").strip()
            if primary:
                fetch_urls.append(primary)
                # If we only have the site root, try /about next
                try:
                    pr = urlparse(primary)
                    path = (pr.path or "").rstrip("/") or "/"
                    if path == "/" and pr.netloc:
                        guess = f"{pr.scheme}://{pr.netloc}/about"
                        if guess not in fetch_urls:
                            fetch_urls.append(guess)
                except Exception:
                    pass
            for u in urls:
                if u not in fetch_urls and host_ok(u):
                    fetch_urls.append(u)
                if len(fetch_urls) >= 5:
                    break

            blob = ""
            for u in fetch_urls[:3]:
                try:
                    blob = fetch_text(u)
                    if len(blob) > 400:
                        break
                except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError):
                    time.sleep(0.4)
                    continue
                time.sleep(0.55)

            if blob:
                hist = extract_history(blob)
                if hist:
                    row[hist_key] = hist
                    changed = True

                ex_key = "Exhibitions (Text List)"
                if not (row.get(ex_key) or "").strip():
                    ex_lines = extract_exhibition_lines(blob)
                    if ex_lines:
                        row[ex_key] = "\n".join(ex_lines)
                        changed = True

        if changed:
            row["Notes"] = append_note(row.get("Notes") or "", stamp)
            updated += 1

    print(f"Rows touched: {updated} / {len(rows)} (dry_run={args.dry_run})")

    if args.dry_run:
        return

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
