#!/usr/bin/env python3
"""
Apply heroHook + storyFullText from docs/features/street-collector/artist-bios-rewritten.md
into content/artist-research-data.json, regenerate editorial_shop_bios_data*.py, and sync CSV.

Run from repo root:
  python3 scripts/apply_artist_bios_rewritten_md.py
"""
from __future__ import annotations

import csv
import json
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MD_PATH = REPO / "docs/features/street-collector/artist-bios-rewritten.md"
JSON_PATH = REPO / "content/artist-research-data.json"
CSV_PATH = REPO / "docs/features/street-collector/artist-research-sheet.csv"
PART1_PATH = REPO / "scripts/editorial_shop_bios_data.py"
PART2_PATH = REPO / "scripts/editorial_shop_bios_data_2.py"

COLLECTION_RE = re.compile(
    r"https?://(?:www\.)?thestreetcollector\.com/collections/([a-z0-9][-a-z0-9]*)",
    re.I,
)

# Slug -> normalized MD header key (when artistName / header differ)
SLUG_TO_MD_NORM: dict[str, str] = {
    "emelio-cerezo": "emilio cerezo",
    "jake-ac-art": "jack ac art",
    "twoone-hiroyasu-tsuri": "twoone",
    "sancho": "sancho sancho",
}

PART1_SLUGS: list[str] = [
    "agus-rucula",
    "ajax-blyth-piper",
    "alice-bureau",
    "alin-mor",
    "animalitoland",
    "antonia-lev",
    "antonia-lev-1",
    "aviv-shamir",
    "beto-val",
    "carsten-gueth",
    "chubby-nida",
    "cokorda-martin",
    "crackthetoy",
    "cubi-boumclap",
    "dawal",
    "dima-korma",
    "eden-kalif",
    "elfassi",
    "emelio-cerezo",
    "erezoo",
    "ezra-baderman",
    "facio",
    "frederique-mati",
    "geometric-bang",
    "hedof",
    "hen-macabi",
    "iain-macarthur",
    "igal-talianski",
    "igor-mikutski",
    "jake-ac-art",
    "jennypo-art",
    "jerome-masi",
    "kaka-chazz",
    "keya-tama",
    "kymo-one",
    "laura-fridman",
    "levi-jacobs",
    "linda-baritski",
    "lobster-robin",
    "loreta-isac",
    "maalavidaa",
    "mameko-maeda",
    "marc-david-spengler",
    "marylou-faure",
    "mathew-gagnon",
    "max-diamond",
    "moritz-adam-schmitt",
]

PART2_SLUGS: list[str] = [
    "moshe-gilboa",
    "my-sunbeam",
    "nasca-uno",
    "nia-shtai",
    "nurit-gross",
    "odsk",
    "ollie-smither",
    "or-bar-el",
    "ori-toor",
    "paola-delfin",
    "phil-huelz",
    "psoman",
    "raki",
    "refiloe-mnisi",
    "rik-lee",
    "s-a-r-g-o-n",
    "samme-snow",
    "sancho",
    "saturn-png",
    "studio-giftig",
    "taloosh",
    "tania-yakunova",
    "thales-towers",
    "thibaud-herem",
    "thomas-stary",
    "tiago-hesp",
    "tiffany-chin",
    "troy-browne",
    "troy-browne-1",
    "twoone-hiroyasu-tsuri",
    "tyler-shelton",
    "unapaulogetic",
    "vivaladybug",
    "woizo",
    "wotto",
    "wuper-kec",
    "yippie-hey",
    "yoaz",
    "yonil",
]


def norm_header(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = s.replace("_", " ")
    s = re.sub(r"[^a-z0-9\s]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def vendor_handle(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def parse_md(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    chunks = re.split(r"\n---\s*\n", text)
    out: dict[str, str] = {}
    header_re = re.compile(r"^\*\*(.+?)\*\*\s*(?:[—–-]\s*(.+))?\s*$")
    for chunk in chunks:
        lines = [ln.rstrip() for ln in chunk.strip().splitlines()]
        if not lines:
            continue
        if lines[0].startswith("#"):
            continue
        m = header_re.match(lines[0].strip())
        if not m:
            continue
        name = m.group(1).strip()
        body_lines = lines[1:]
        while body_lines and not body_lines[0].strip():
            body_lines.pop(0)
        body = "\n\n".join(
            p.strip() for p in "\n".join(body_lines).split("\n\n") if p.strip()
        )
        if not body:
            continue
        key = norm_header(name)
        if key in out:
            raise SystemExit(f"Duplicate MD header key: {key!r} ({name})")
        out[key] = body
    return out


def make_hero(story: str, max_len: int = 175) -> str:
    story = (story or "").strip()
    if not story:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", story, maxsplit=1)
    first = parts[0].strip()
    if len(first) <= max_len:
        base = first
    else:
        para = story.split("\n\n")[0].strip()
        if len(para) <= max_len:
            base = para
        else:
            cut = para[: max_len + 1]
            sp = cut.rfind(" ")
            if sp > 50:
                cut = cut[:sp].rstrip(",;—")
            else:
                cut = cut[:max_len].rstrip()
            base = cut + "…"
    return base


def with_instagram(hero: str, handle: str, max_total: int = 195) -> str:
    h = (handle or "").strip()
    if not h or h.lower() in hero.lower():
        return hero
    suffix = f" ({h})"
    if len(hero) + len(suffix) <= max_total:
        return hero.rstrip() + suffix
    room = max_total - len(suffix) - 1
    if room < 40:
        return hero
    trimmed = hero[:room]
    sp = trimmed.rfind(" ")
    if sp > 30:
        trimmed = trimmed[:sp].rstrip(",;—") + "…"
    else:
        trimmed = trimmed.rstrip() + "…"
    return trimmed + suffix


def sync_csv(data: dict[str, dict[str, str]]) -> None:
    if not CSV_PATH.is_file():
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


def render_editorial_file(
    path: Path,
    var: str,
    title: str,
    slugs: list[str],
    data: dict[str, dict[str, str]],
) -> None:
    lines = [
        f"# Blog-style shop bios ({title}). Imported by merge_blog_style_artist_bios.py",
        "from __future__ import annotations",
        "",
        f"{var}: dict[str, dict[str, str]] = {{",
    ]
    for slug in slugs:
        row = data[slug]
        hero = row.get("heroHook") or ""
        story = row.get("storyFullText") or ""
        active = row.get("activeSince") or ""
        lines.append(f'    {json.dumps(slug)}: {{')
        lines.append(f'        "heroHook": {json.dumps(hero)},')
        lines.append(f'        "storyFullText": {json.dumps(story)},')
        lines.append(f'        "activeSince": {json.dumps(active)},')
        lines.append("    },")
    lines.append("}")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {path}")


def main() -> None:
    md_map = parse_md(MD_PATH)
    data: dict[str, dict[str, str]] = json.loads(JSON_PATH.read_text(encoding="utf-8"))

    note_tag = (
        "\n\n[Shop bio applied from docs/features/street-collector/artist-bios-rewritten.md "
        "via scripts/apply_artist_bios_rewritten_md.py.]"
    )

    missing: list[str] = []
    for slug, row in sorted(data.items()):
        md_key = SLUG_TO_MD_NORM.get(slug) or norm_header(row.get("artistName") or slug)
        body = md_map.get(md_key)
        if body is None:
            missing.append(f"{slug} (tried md key {md_key!r})")
            continue
        hero = with_instagram(make_hero(body), row.get("instagramHandle") or "")
        row["heroHook"] = hero
        row["storyFullText"] = body
        notes = (row.get("notes") or "").strip()
        if "artist-bios-rewritten.md" not in notes:
            row["notes"] = (notes + note_tag).strip() if notes else note_tag.strip()
        data[slug] = row

    if missing:
        raise SystemExit("No MD body for:\n  " + "\n  ".join(missing))

    used = set()
    for slug in data:
        md_key = SLUG_TO_MD_NORM.get(slug) or norm_header(data[slug].get("artistName") or slug)
        if md_key in md_map:
            used.add(md_key)
    unused = set(md_map.keys()) - used
    if unused:
        raise SystemExit(f"MD sections not matched to any slug: {sorted(unused)}")

    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {JSON_PATH} ({len(data)} slugs)")

    render_editorial_file(PART1_PATH, "SHOP_BIOS_PART1", "part 1 of 2", PART1_SLUGS, data)
    render_editorial_file(PART2_PATH, "SHOP_BIOS_PART2", "part 2 of 2", PART2_SLUGS, data)
    sync_csv(data)


if __name__ == "__main__":
    main()
