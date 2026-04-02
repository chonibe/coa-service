#!/usr/bin/env python3
"""
Extract direct image URLs from artist portfolio / shop pages and (best-effort) public Instagram HTML.

Fills empty CSV columns:
  Process Image 1–4 (URL) — optional labels "Portfolio" / "Instagram"
  Instagram Images (URLs) — newline list when IG HTML exposes scontent display_url entries

Sources per artist:
  - About Page URL (primary)
  - Up to 4 http(s) lines from Sources (Links) that are not in SKIP_FETCH_HOSTS
  - https://www.instagram.com/<handle>/ when Instagram Handle is set

Uses stdlib only. Respect robots/latency: sleeps between requests.

Usage:
  python3 scripts/extract_artist_portfolio_images.py --dry-run
  python3 scripts/extract_artist_portfolio_images.py --max-artists 30
  python3 scripts/extract_artist_portfolio_images.py --artist "Jerome Masi"
  python3 scripts/extract_artist_portfolio_images.py --force   # overwrite existing process image URLs
"""
from __future__ import annotations

import argparse
import csv
import html as html_module
import re
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

REPO = Path(__file__).resolve().parents[1]
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36; StreetCollectorImageExtract/1.0"
)
CTX = ssl.create_default_context()

SKIP_FETCH_HOSTS = frozenset(
    {
        "linkedin.com",
        "www.linkedin.com",
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

BAD_URL = re.compile(
    r"(favicon|pixel\.gif|spacer|1x1|doubleclick|google-analytics|facebook\.com/tr|"
    r"gravatar|emoji|/logo|/icon|/icons/|sprite|badge|tracking|analytics|"
    r"placeholder|blank\.gif|clear\.gif)",
    re.I,
)

# Meta / link image hints
RE_OG = re.compile(
    r'<meta[^>]+property\s*=\s*["\']og:image(?::secure_url)?["\'][^>]+content\s*=\s*["\']([^"\']+)["\']',
    re.I,
)
RE_OG_CONTENT_FIRST = re.compile(
    r'<meta[^>]+content\s*=\s*["\']([^"\']+)["\'][^>]+property\s*=\s*["\']og:image(?::secure_url)?["\']',
    re.I,
)
RE_TWITTER = re.compile(
    r'<meta[^>]+name\s*=\s*["\']twitter:image(?:\:src)?["\'][^>]+content\s*=\s*["\']([^"\']+)["\']',
    re.I,
)
RE_IMG_SRC = re.compile(r'<img[^>]+src\s*=\s*["\']([^"\']+)["\']', re.I)
RE_DATA_SRC = re.compile(
    r'(?:data-src|data-lazy-src|data-original)\s*=\s*["\']([^"\']+)["\']',
    re.I,
)
RE_SRCSET = re.compile(r'(?:srcset)\s*=\s*["\']([^"\']+)["\']', re.I)
# Instagram embedded JSON (public profile sometimes includes timeline media)
RE_IG_DISPLAY = re.compile(r'"display_url"\s*:\s*"((?:[^"\\]|\\.)*)"')

def _unescape_ig_url(s: str) -> str:
    return s.replace("\\/", "/").replace("\\u0026", "&").replace("\\u003d", "=")

GOOD_HINT = re.compile(
    r"(/uploads/|/wp-content/|/media/|cdn\.|cloudinary|imgix|shopifycdn|shopify\.com/s/files|"
    r"images\.unsplash|behance\.net/project_modules|format=webp|w_\d{3,}|/large/|/original/)",
    re.I,
)


def artist_name_boost(url: str, artist_name: str) -> int:
    if not artist_name:
        return 0
    tokens = [
        t
        for t in re.sub(r"[^a-z0-9]+", " ", artist_name.lower()).split()
        if len(t) > 3
    ]
    low = url.lower()
    return sum(10 for t in tokens if t in low)


def host_ok(url: str) -> bool:
    try:
        h = urlparse(url).netloc.lower()
        if h.startswith("www."):
            h = h[4:]
    except Exception:
        return False
    if h in SKIP_FETCH_HOSTS:
        return False
    if "linkedin.com" in h:
        return False
    return True


def iter_urls(sources: str) -> list[str]:
    out: list[str] = []
    for line in (sources or "").splitlines():
        u = line.strip()
        if u.lower().startswith("http"):
            out.append(u.split()[0])
    return out


def absolutize(base: str, raw: str) -> str:
    u = html_module.unescape(raw.strip())
    if not u or u.startswith("data:"):
        return ""
    if u.startswith("//"):
        u = "https:" + u
    if not u.startswith("http"):
        u = urljoin(base, u)
    low = u.lower()
    if low.split("?", 1)[0].endswith((".svg", ".ico")):
        return ""
    return u


def score_portfolio_url(u: str, *, from_meta: bool) -> int:
    s = 0
    if from_meta:
        s += 25
    low = u.lower()
    if GOOD_HINT.search(low):
        s += 12
    if any(ext in low for ext in (".jpg", ".jpeg", ".png", ".webp")):
        s += 6
    if "instagram.com" in low and "scontent" in low:
        s += 15
    if BAD_URL.search(low):
        s -= 40
    # Penalize obvious tiny thumbs
    if re.search(r"[/_-](16|24|32|48|64)x\d+", low):
        s -= 20
    return s


def pick_largest_srcset(candidate: str) -> str:
    """If srcset, take the last URL (often largest descriptor)."""
    parts = [p for p in re.split(r"\s*,\s*", candidate) if p.strip()]
    if not parts:
        return candidate
    bits = parts[-1].strip().split()
    if not bits:
        return candidate
    last = bits[0]
    return last if last.startswith("http") else candidate


def extract_candidates(page_url: str, html: str) -> list[tuple[str, int, bool]]:
    """Return (absolute_url, score, from_meta) unique best-effort."""
    found: list[tuple[str, int, bool]] = []
    seen: set[str] = set()

    def add(raw: str, from_meta: bool) -> None:
        u = absolutize(page_url, raw)
        if not u or not u.startswith("http"):
            return
        if u in seen:
            return
        seen.add(u)
        sc = score_portfolio_url(u, from_meta=from_meta)
        if sc < -5:
            return
        found.append((u, sc, from_meta))

    for rx in (RE_OG, RE_OG_CONTENT_FIRST, RE_TWITTER):
        for m in rx.finditer(html):
            add(m.group(1), True)

    for m in RE_DATA_SRC.finditer(html):
        add(m.group(1), False)
    for m in RE_IMG_SRC.finditer(html):
        add(m.group(1), False)
    for m in RE_SRCSET.finditer(html):
        add(pick_largest_srcset(m.group(1)), False)

    found.sort(key=lambda t: -t[1])
    return found


def extract_instagram_scontent(html: str, limit: int = 10) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for m in RE_IG_DISPLAY.finditer(html):
        u = _unescape_ig_url(m.group(1))
        if not u.startswith("http") or "scontent" not in u:
            continue
        if u in seen:
            continue
        seen.add(u)
        out.append(u)
        if len(out) >= limit:
            break
    return out


def fetch_html(url: str, max_bytes: int = 900_000) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    with urllib.request.urlopen(req, timeout=28, context=CTX) as resp:
        raw = resp.read(max_bytes)
    return raw.decode("utf-8", errors="replace")


def instagram_profile_url(handle: str) -> str:
    h = handle.strip().lstrip("@").split("/")[0].split("?")[0].strip()
    if not h:
        return ""
    return f"https://www.instagram.com/{h}/"


def collect_fetch_urls(row: dict[str, str], *, ig_only: bool = False) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()

    def push(u: str) -> None:
        u = u.strip()
        if not u or u in seen:
            return
        seen.add(u)
        ordered.append(u)

    ig = instagram_profile_url(row.get("Instagram Handle") or "")
    if ig_only:
        if ig:
            push(ig)
        return ordered

    about = (row.get("About Page URL (primary)") or "").strip()
    if about:
        push(about)

    for u in iter_urls(row.get("Sources (Links)") or ""):
        if not host_ok(u):
            continue
        push(u)
        if len(ordered) >= 6:
            break

    if ig:
        push(ig)

    return ordered


def process_row(
    row: dict[str, str],
    *,
    force: bool,
    dry_run: bool,
) -> bool:
    artist_name = (row.get("Artist Name") or "").strip()
    url_cols = [
        "Process Image 1 (URL)",
        "Process Image 2 (URL)",
        "Process Image 3 (URL)",
        "Process Image 4 (URL)",
    ]
    label_cols = [
        "Process Image 1 Label",
        "Process Image 2 Label",
        "Process Image 3 Label",
        "Process Image 4 Label",
    ]
    ig_col = "Instagram Images (URLs)"

    need_process = force or not any((row.get(c) or "").strip() for c in url_cols)
    need_ig = force or not (row.get(ig_col) or "").strip()

    if not need_process and not need_ig:
        return False

    portfolio_pool: list[tuple[str, int, bool]] = []
    ig_urls: list[str] = []

    fetch_list = collect_fetch_urls(row, ig_only=(not need_process) and need_ig)
    if not fetch_list:
        if dry_run:
            print(f"[dry-run] {artist_name}: no URLs to fetch (add Instagram handle for IG images)")
            return False
        return False

    for page_url in fetch_list:
        if not page_url:
            continue
        is_ig = "instagram.com" in page_url.lower()
        try:
            body = fetch_html(page_url)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError, ValueError):
            time.sleep(0.45)
            continue

        if is_ig:
            ig_urls.extend(extract_instagram_scontent(body))
        else:
            portfolio_pool.extend(extract_candidates(page_url, body))

        time.sleep(0.55)

    # Dedupe portfolio URLs preserving best score (+ name match boost)
    best: dict[str, int] = {}
    for u, sc, _fm in portfolio_pool:
        sc2 = sc + artist_name_boost(u, artist_name)
        if u not in best or sc2 > best[u]:
            best[u] = sc2
    ranked = sorted(best.keys(), key=lambda u: -best[u])

    fill_slots: list[str] = []
    seen_slot: set[str] = set()
    for u in ranked:
        if u not in seen_slot:
            seen_slot.add(u)
            fill_slots.append(u)
    for u in ig_urls:
        if u not in seen_slot:
            seen_slot.add(u)
            fill_slots.append(u)
        if len(fill_slots) >= 8:
            break

    if dry_run:
        name = row.get("Artist Name") or ""
        print(f"[dry-run] {name}: process_slots={fill_slots[:4]} ig_lines={len(ig_urls)}")
        return bool(fill_slots or ig_urls)

    changed = False

    if need_process:
        for i, col in enumerate(url_cols):
            if i < len(fill_slots) and (force or not (row.get(col) or "").strip()):
                url = fill_slots[i]
                row[col] = url
                lc = label_cols[i]
                src = "Instagram" if "scontent" in url or "cdninstagram" in url.lower() else "Portfolio"
                if force or not (row.get(lc) or "").strip():
                    row[lc] = src
                changed = True

    if need_ig and ig_urls:
        # Dedupe ig while keeping order
        seen_i: set[str] = set()
        uniq: list[str] = []
        for u in ig_urls:
            if u not in seen_i:
                seen_i.add(u)
                uniq.append(u)
        uniq = uniq[:12]
        line = "\n".join(uniq)
        if force or not (row.get(ig_col) or "").strip():
            row[ig_col] = line
            changed = True

    if changed:
        stamp = "Auto image extract: portfolio/IG HTML (verify URLs display)."
        n = (row.get("Notes") or "").strip()
        if stamp not in n:
            row["Notes"] = f"{n}\n{stamp}".strip() if n else stamp

    return changed


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="Overwrite existing process / IG image cells")
    ap.add_argument("--artist", type=str, default="", help="Only this artist name (exact CSV match)")
    ap.add_argument(
        "--max-artists",
        type=int,
        default=0,
        help="Stop after N artists that received a fetch attempt (0 = no limit)",
    )
    args = ap.parse_args()

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    updated = 0
    attempts = 0
    for row in rows:
        name = (row.get("Artist Name") or "").strip()
        if not name:
            continue
        if args.artist and name != args.artist.strip():
            continue

        # Only attempt if we might fill something
        url_cols = [f"Process Image {i} (URL)" for i in range(1, 5)]
        ig_col = "Instagram Images (URLs)"
        could_use = args.force or not any((row.get(c) or "").strip() for c in url_cols) or not (row.get(ig_col) or "").strip()
        if not could_use:
            continue

        attempts += 1
        if process_row(row, force=args.force, dry_run=args.dry_run):
            updated += 1
        if args.max_artists and attempts >= args.max_artists:
            break
        time.sleep(0.35)

    print(f"Artists attempted: {attempts}, updated: {updated}, dry_run={args.dry_run}")

    if args.dry_run:
        return

    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


if __name__ == "__main__":
    main()
