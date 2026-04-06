#!/usr/bin/env python3
"""
Second-pass enrichment: DuckDuckGo Lite HTML search per artist to fill gaps in
Exhibitions, Press, Additional History, and About URL when Sources lack a site.

Respectful defaults: ~1.2s delay between requests; stdlib only.

Usage:
  python3 scripts/enrich_artist_research_web_ddg.py
  python3 scripts/enrich_artist_research_web_ddg.py --dry-run
  python3 scripts/enrich_artist_research_web_ddg.py --only "Marc David Spengler"
"""
from __future__ import annotations

import argparse
import csv
import html as htmlmod
import re
import ssl
import time
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

REPO = Path(__file__).resolve().parents[1]
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
CTX = ssl.create_default_context()

SKIP_PRESS_HOSTS = frozenset(
    {
        "duckduckgo.com",
        "www.duckduckgo.com",
        "instagram.com",
        "www.instagram.com",
        "linkedin.com",
        "www.linkedin.com",
        "facebook.com",
        "www.facebook.com",
        "twitter.com",
        "www.twitter.com",
        "x.com",
        "www.x.com",
        "behance.net",
        "www.behance.net",
        "dribbble.com",
        "www.dribbble.com",
        "pinterest.com",
        "www.pinterest.com",
        "youtube.com",
        "www.youtube.com",
        "tiktok.com",
        "www.tiktok.com",
        "thestreetcollector.com",
        "www.thestreetcollector.com",
    }
)

ABOUT_HINTS = ("/about", "/bio", "/cv", "/info", "a-propos", "uber-mich", "/sobre", "/om/")


def ddg_decode_href(href: str) -> str:
    href = href.strip()
    if href.startswith("//"):
        href = "https:" + href
    if "uddg=" not in href:
        return href
    q = parse_qs(urlparse(href).query)
    raw = (q.get("uddg") or [""])[0]
    return unquote(raw) if raw else href


def strip_tags(s: str) -> str:
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", htmlmod.unescape(s)).strip()


def ddg_search(query: str) -> list[tuple[str, str, str]]:
    """Return list of (real_url, link_title, snippet)."""
    q = urllib.parse.quote(query)
    url = f"https://lite.duckduckgo.com/lite/?q={q}"
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    with urllib.request.urlopen(req, timeout=25, context=CTX) as resp:
        page = resp.read().decode("utf-8", errors="replace")
    out: list[tuple[str, str, str]] = []
    for m in re.finditer(r'href="([^"]+)"\s+class=\'result-link\'>([^<]*)</a>', page):
        href = ddg_decode_href(m.group(1))
        title = strip_tags(m.group(2))
        rest = page[m.end() : m.end() + 6000]
        sm = re.search(r"class='result-snippet'>([\s\S]*?)</td>", rest)
        if not sm:
            continue
        snippet = strip_tags(sm.group(1))
        if not href.startswith("http"):
            continue
        out.append((href, title, snippet))
    return out[:10]


def host_label(url: str) -> str:
    try:
        h = urlparse(url).netloc.replace("www.", "").split(".")[0]
        return h.replace("-", " ").title() if h else "Web"
    except Exception:
        return "Web"


def host_key(url: str) -> str:
    try:
        return urlparse(url).netloc.lower().replace("www.", "")
    except Exception:
        return ""


def merge_unique_lines(existing: str, new_lines: list[str]) -> str:
    cur = (existing or "").strip()
    seen = {ln.strip().lower() for ln in cur.splitlines() if ln.strip()}
    add: list[str] = []
    for ln in new_lines:
        k = ln.strip().lower()
        if k and k not in seen:
            seen.add(k)
            add.append(ln.strip())
    if not add:
        return cur
    return (cur + "\n" + "\n".join(add)).strip() if cur else "\n".join(add)


def pick_about_from_results(results: list[tuple[str, str, str]], current: str) -> str:
    if (current or "").strip():
        return current.strip()
    for url, title, _ in results:
        low = url.lower()
        if any(h in low for h in ABOUT_HINTS):
            return url
    # First non-social portfolio-ish
    for url, _, _ in results:
        hk = host_key(url)
        if hk and hk not in SKIP_PRESS_HOSTS and "google." not in hk:
            return url
    return ""


def history_from_snippets(results: list[tuple[str, str, str]], max_chars: int = 1400) -> str:
    chunks: list[str] = []
    seen: set[str] = set()
    for _, title, snip in results:
        for part in (title, snip):
            part = part.strip()
            if len(part) < 35:
                continue
            sig = part[:50].lower()
            if sig in seen:
                continue
            seen.add(sig)
            chunks.append(part)
    body = " ".join(chunks)
    if len(body) > max_chars:
        body = body[: max_chars - 1].rsplit(" ", 1)[0] + "…"
    if not body:
        return ""
    return (
        "Web research summary via search (verify before publishing):\n\n" + body
    )


def press_lines_from_results(
    results: list[tuple[str, str, str]], existing_press: str
) -> list[str]:
    existing_low = (existing_press or "").lower()
    lines: list[str] = []
    for url, title, snip in results:
        hk = host_key(url)
        if not hk or hk in SKIP_PRESS_HOSTS:
            continue
        if url.lower() in existing_low:
            continue
        if "google." in hk:
            continue
        label = host_label(url)
        blurb = (title or snip)[:160]
        if len(snip) > len(title) + 20:
            blurb = snip[:200]
        line = f"{label} — — {blurb} — {url}"
        if line.lower() not in existing_low and url not in existing_low:
            lines.append(line)
    return lines[:8]


def exhibition_lines_from_text(blob: str) -> list[str]:
    found: list[str] = []
    seen_sig: set[str] = set()
    for sent in re.split(r"(?<=[.!?])\s+", blob):
        if len(sent) < 40:
            continue
        if not re.search(
            r"\b(exhibition|exhibitions|solo show|group show|biennale|biennial|mural|gallery|museum|fair|residency|"
            r"show at|show in|vernis|selected exhibitions)\b",
            sent,
            re.I,
        ):
            continue
        ym = re.search(r"\b((?:19|20)\d{2})\b", sent)
        if not ym:
            continue
        year = ym.group(1)
        frag = sent.strip()
        if len(frag) > 260:
            frag = frag[:257] + "…"
        line = f"{year} — {frag}"
        sig = line[:88].lower()
        if sig not in seen_sig:
            seen_sig.add(sig)
            found.append(line)
    return found[:10]


def needs_web(row: dict) -> bool:
    ex = (row.get("Exhibitions (Text List)") or "").strip()
    pr = (row.get("Press (Text + Links)") or "").strip()
    hist = (row.get("Additional History & CV (text)") or "").strip()
    about = (row.get("About Page URL (primary)") or "").strip()
    if not about:
        return True
    if not ex:
        return True
    if not pr:
        return True
    if not hist or len(hist) < 90:
        return True
    return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", type=str, default="", help="Single artist name")
    ap.add_argument("--delay", type=float, default=1.25, help="Seconds between DDG requests")
    args = ap.parse_args()

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    stamp = "Web DDG enrichment 2026-04-02 — verify lines before marketing."
    touched = 0

    for row in rows:
        name = (row.get("Artist Name") or "").strip()
        if not name:
            continue
        if args.only and name != args.only:
            continue
        if not needs_web(row):
            continue

        ig = (row.get("Instagram Handle") or "").replace("@", "").strip()
        q = f'"{name}" illustrator OR artist OR painter biography'
        if ig:
            q += f" OR {ig}"

        try:
            results = ddg_search(q)
        except Exception as e:
            print(f"DDG fail {name!r}: {e}")
            time.sleep(args.delay)
            continue

        time.sleep(args.delay)

        if not results:
            print(f"No results: {name!r}")
            continue

        changed = False
        about_col = "About Page URL (primary)"
        new_about = pick_about_from_results(results, row.get(about_col) or "")
        if new_about and new_about != (row.get(about_col) or "").strip():
            row[about_col] = new_about
            changed = True

        hist_col = "Additional History & CV (text)"
        existing_hist = (row.get(hist_col) or "").strip()
        if "Web research summary via search" not in existing_hist and (
            not existing_hist or len(existing_hist) < 90
        ):
            h = history_from_snippets(results)
            if h:
                row[hist_col] = f"{existing_hist}\n\n{h}".strip() if existing_hist else h
                changed = True

        press_col = "Press (Text + Links)"
        pl = press_lines_from_results(results, row.get(press_col) or "")
        if pl:
            row[press_col] = merge_unique_lines(row.get(press_col) or "", pl)
            changed = True

        ex_col = "Exhibitions (Text List)"
        if not (row.get(ex_col) or "").strip():
            blob = " ".join(f"{t} {s}" for _, t, s in results)
            exl = exhibition_lines_from_text(blob)
            if exl:
                row[ex_col] = merge_unique_lines("", exl)
                changed = True

        if changed:
            n = (row.get("Notes") or "").strip()
            if stamp not in n:
                row["Notes"] = f"{n}\n{stamp}".strip() if n else stamp
            touched += 1

    print(f"DDG rows updated: {touched} (dry_run={args.dry_run})")

    if args.dry_run:
        return

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
